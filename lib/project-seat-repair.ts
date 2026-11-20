export function repairProjectGuestSeats(db: D1Database, meetingIds: readonly string[]): D1PreparedStatement {
  return db.prepare(`
    -- Recover assignments made by the old first-free-seat rule. A matching guest
    -- must already have voted in this meeting and its chosen seat must be vacant.
    WITH candidates AS (
      SELECT source.meeting_id,
             source.avatar AS source_avatar,
             destination.avatar AS destination_avatar,
             source.member_id,
             COUNT(*) OVER (PARTITION BY source.meeting_id, destination.avatar) AS matches
      FROM project_meeting_respondents AS source
      JOIN project_members AS member ON member.id = source.member_id AND member.token GLOB 'guest-*'
      JOIN project_profiles AS profile ON profile.id = source.member_id
      JOIN project_meeting_respondents AS destination
        ON destination.meeting_id = source.meeting_id
       AND destination.avatar = profile.avatar
       AND destination.member_id IS NULL
      WHERE source.meeting_id IN (SELECT value FROM json_each(?))
        AND source.avatar < destination.avatar
        AND NOT EXISTS (
          SELECT 1
          FROM project_proposals AS finalized
          WHERE finalized.confirmed = 1
            AND (finalized.meeting_id = source.meeting_id OR
                 (finalized.meeting_id IS NULL AND finalized.id = source.meeting_id))
        )
        AND EXISTS (
          SELECT 1
          FROM project_responses AS response
          JOIN project_proposals AS proposal ON proposal.id = response.proposal_id
          WHERE response.member_id = source.member_id
            AND (proposal.meeting_id = source.meeting_id OR
                 (proposal.meeting_id IS NULL AND proposal.id = source.meeting_id))
        )
    ),
    moves AS MATERIALIZED (
      SELECT meeting_id, source_avatar, destination_avatar, member_id
      FROM candidates
      WHERE matches = 1
    ),
    seat_updates AS (
      SELECT meeting_id, source_avatar AS avatar, NULL AS member_id, 0 AS phase FROM moves
      UNION ALL
      SELECT meeting_id, destination_avatar, member_id, 1 FROM moves
    )
    -- Clear the source seats first to satisfy the one-seat-per-member index.
    -- The ordered UPSERT keeps both reserved rows and changes only member_id.
    INSERT INTO project_meeting_respondents (meeting_id, avatar, member_id)
    SELECT meeting_id, avatar, member_id
    FROM seat_updates
    WHERE TRUE
    ORDER BY phase
    ON CONFLICT (meeting_id, avatar) DO UPDATE SET member_id = excluded.member_id;
  `).bind(JSON.stringify(meetingIds));
}
