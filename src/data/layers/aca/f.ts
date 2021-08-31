/* eslint-disable */
import { layers as tmp } from "@/game/layers";
import player from "@/game/player";
import { RawLayer } from "@/typings/layer";
import Decimal, { formatWhole } from "@/util/bignum";
import { getClickableState } from "@/util/features";

export default {
  id: "f",
  infoboxes: {
    data: {
      coolInfo: {
        title: "Lore",
        titleStyle: { color: "#FE0000" },
        body: "DEEP LORE!",
        bodyStyle: { "background-color": "#0000EE" }
      }
    }
  },

  startData() {
    return {
      unlocked: false,
      points: new Decimal(0),
      boop: false,
      clickables: { [11]: "Start" } // Optional default Clickable state
    };
  },
  color: "#FE0102",
  requires() {
    return new Decimal(10);
  },
  resource: "farm points",
  baseResource: "points",
  baseAmount() {
    return player.points;
  },
  type: "static",
  exponent: 0.5,
  base: 3,
  roundUpCost: true,
  canBuyMax() {
    return false;
  },
  name: "Farms",
  //directMult() {return new Decimal(player.layers.c.otherThingy)},

  row: 1,
  branches: [
    {
      target: "c",
      "stroke-width": "25px",
      stroke: "blue",
      style: "filter: blur(5px)"
    }
  ], // When this layer appears, a branch will appear from this layer to any layers here. Each entry can be a pair consisting of a layer id and a color.

  tooltipLocked() {
    // Optional, tooltip displays when the layer is locked
    return "This weird farmer dinosaur will only see you if you have at least {{layers.f.requires}} points. You only have {{ formatWhole(player.points) }}";
  },
  midsection:
    '<div><br/><img src="https://images.beano.com/store/24ab3094eb95e5373bca1ccd6f330d4406db8d1f517fc4170b32e146f80d?auto=compress%2Cformat&dpr=1&w=390" /><div>Bork Bork!</div></div>',
  // The following are only currently used for "custom" Prestige type:
  prestigeButtonDisplay() {
    //Is secretly HTML
    if (!this.canBuyMax)
      return (
        "Hi! I'm a <u>weird dinosaur</u> and I'll give you a Farm Point in exchange for all of your points and lollipops! (At least " +
        formatWhole(tmp[this.layer].nextAt) +
        " points)"
      );
    if (this.canBuyMax)
      return (
        "Hi! I'm a <u>weird dinosaur</u> and I'll give you <b>" +
        formatWhole(tmp[this.layer].resetGain) +
        "</b> Farm Points in exchange for all of your points and lollipops! (You'll get another one at " +
        formatWhole(tmp[this.layer].nextAt) +
        " points)"
      );
  },
  canReset() {
    return Decimal.gte(tmp[this.layer].baseAmount!, tmp[this.layer].nextAt);
  },
  // This is also non minimal, a Clickable!
  clickables: {
    masterButtonClick() {
      if (getClickableState(this.layer, 11) == "Borkened...")
        player.layers[this.layer].clickables![11] = "Start";
    },
    masterButtonDisplay() {
      return getClickableState(this.layer, 11) == "Borkened..."
        ? "Fix the clickable!"
        : "Does nothing";
    }, // Text on Respec button, optional
    data: {
      11: {
        title: "Clicky clicky!", // Optional, displayed at the top in a larger font
        display() {
          // Everything else displayed in the buyable button after the title
          const data = getClickableState(this.layer, this.id);
          return "Current state:<br>" + data;
        },
        unlocked() {
          return player.layers[this.layer].unlocked;
        },
        canClick() {
          return getClickableState(this.layer, this.id) !== "Borkened...";
        },
        click() {
          switch (getClickableState(this.layer, this.id)) {
            case "Start":
              player.layers[this.layer].clickables![this.id] = "A new state!";
              break;
            case "A new state!":
              player.layers[this.layer].clickables![this.id] = "Keep going!";
              break;
            case "Keep going!":
              player.layers[this.layer].clickables![this.id] =
                "Maybe that's a bit too far...";
              break;
            case "Maybe that's a bit too far...":
              //makeParticles(coolParticle, 4)
              player.layers[this.layer].clickables![this.id] = "Borkened...";
              break;
            default:
              player.layers[this.layer].clickables![this.id] = "Start";
              break;
          }
        },
        hold() {
          console.log("Clickkkkk...");
        },
        style() {
          switch (getClickableState(this.layer, this.id)) {
            case "Start":
              return { "background-color": "green" };
            case "A new state!":
              return { "background-color": "yellow" };
            case "Keep going!":
              return { "background-color": "orange" };
            case "Maybe that's a bit too far...":
              return { "background-color": "red" };
            default:
              return {};
          }
        }
      }
    }
  }
} as RawLayer;
