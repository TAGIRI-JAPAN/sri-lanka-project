import kirie01 from "./project-portraits-assets/01.webp?inline";
import kirie04 from "./project-portraits-assets/04.webp?inline";
import kirie05 from "./project-portraits-assets/05.webp?inline";
import kirie06 from "./project-portraits-assets/06.webp?inline";
import portrait01 from "./project-portraits-assets/landscape-palm-village-road.webp?inline";
import portrait02 from "./project-portraits-assets/02.webp?inline";
import portrait03 from "./project-portraits-assets/03.webp?inline";
import portrait04 from "./project-portraits-assets/landscape-sigiriya.webp?inline";
import portrait05 from "./project-portraits-assets/landscape-tea-highlands.webp?inline";
import portrait06 from "./project-portraits-assets/landscape-kandy-lake.webp?inline";
import portrait07 from "./project-portraits-assets/07.webp?inline";
import portrait08 from "./project-portraits-assets/08.webp?inline";
import portrait09 from "./project-portraits-assets/09.webp?inline";
import type { ProjectPortraits } from "./project";

export const portraits: ProjectPortraits = {
  "01": portrait01, "02": portrait02, "03": portrait03, "04": portrait04,
  "05": portrait05, "06": portrait06, "07": portrait07, "08": portrait08, "09": portrait09,
};

export const kiriePortraits: ProjectPortraits = {
  ...portraits, "01": kirie01, "04": kirie04, "05": kirie05, "06": kirie06,
};
