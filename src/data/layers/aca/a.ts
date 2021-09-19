/* eslint-disable */
import player from "@/game/player";
import { GridCell } from "@/typings/features/grid";
import { RawLayer } from "@/typings/layer";
import Decimal from "@/util/bignum";

export default {
  id: "a",
  startData() {
    return {
      unlocked: true,
      points: new Decimal(0)
    };
  },
  color: "yellow",
  modal: true,
  name: "Achievements",
  resource: "achievement power",
  row: "side",
  tooltip() {
    // Optional, tooltip displays when the layer is locked
    return "Achievements";
  },
  achievementPopups: true,
  achievements: {
    data: {
      11: {
        image: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
        name: "Get me!",
        done() {
          return true;
        }, // This one is a freebie
        goalTooltip: "How did this happen?", // Shows when achievement is not completed
        doneTooltip: "You did it!" // Showed when the achievement is completed
      },
      12: {
        name: "Impossible!",
        done() {
          return false;
        },
        goalTooltip: "Mwahahaha!", // Shows when achievement is not completed
        doneTooltip: "HOW????", // Showed when the achievement is completed
        style: { color: "#04e050" }
      },
      13: {
        name: "EIEIO",
        done() {
          return player.layers.f.points.gte(1);
        },
        tooltip:
          "Get a farm point.\n\nReward: The dinosaur is now your friend (you can max Farm Points).", // Showed when the achievement is completed
        onComplete() {
          console.log("Bork bork bork!");
        }
      }
    }
  },
  midsection: "<grid id='test' />",
  grids: {
    data: {
      test: {
        maxRows: 3,
        rows: 2,
        cols: 2,
        getStartState(cell: string) {
          return cell;
        },
        getUnlocked() {
          // Default
          return true;
        },
        getCanClick() {
          return player.points.eq(10);
        },
        getStyle(cell) {
          return { backgroundColor: "#" + ((Number((this[cell] as GridCell).state) * 1234) % 999999) };
        },
        click(cell) {
          // Don't forget onHold
          (this[cell] as GridCell).state = ((this[cell] as GridCell).state as number) + 1;
        },
        getTitle(cell) {
          let direction;
          if (cell === "101") {
            direction = "top";
          } else if (cell === "102") {
            direction = "bottom";
          } else if (cell === "201") {
            direction = "left";
          } else if (cell === "202") {
            direction = "right";
          }
          return `<tooltip display='${JSON.stringify(this.style)}' ${direction}>
                        <h3>Gridable #${cell}</h3>
                    </tooltip>`;
        },
        getDisplay(cell) {
          return (this[cell] as GridCell).state;
        }
      }
    }
  }
} as RawLayer;
