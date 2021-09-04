/* eslint-disable */
import { Direction } from "@/game/enums";
import { layers } from "@/game/layers";
import player from "@/game/player";
import { DecimalSource } from "@/lib/break_eternity";
import { RawLayer } from "@/typings/layer";
import Decimal, { format, formatWhole } from "@/util/bignum";
import {
  buyableEffect,
  challengeCompletions,
  getBuyableAmount,
  hasMilestone,
  hasUpgrade,
  setBuyableAmount,
  upgradeEffect
} from "@/util/features";
import { resetLayer, resetLayerData } from "@/util/layers";

export default {
  id: "c", // This is assigned automatically, both to the layer and all upgrades, etc. Shown here so you know about it
  name: "Candies", // This is optional, only used in a few places, If absent it just uses the layer id.
  symbol: "C", // This appears on the layer's node. Default is the id with the first letter capitalized
  position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
  startData() {
    return {
      unlocked: true,
      points: new Decimal(0),
      best: new Decimal(0),
      total: new Decimal(0),
      beep: false,
      thingy: "pointy",
      otherThingy: 10,
      spentOnBuyables: new Decimal(0)
    };
  },
  minWidth: 800,
  color: "#4BDC13",
  requires: new Decimal(10), // Can be a function that takes requirement increases into account
  resource: "lollipops", // Name of prestige currency
  baseResource: "points", // Name of resource prestige is based on
  baseAmount() {
    return player.points;
  }, // Get the current amount of baseResource
  type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
  exponent: 0.5, // Prestige currency exponent
  base: 5, // Only needed for static layers, base of the formula (b^(x^exp))
  roundUpCost: false, // True if the cost needs to be rounded up (use when baseResource is static?)

  // For normal layers, gain beyond [softcap] points is put to the [softcapPower]th power
  softcap: new Decimal(1e100),
  softcapPower: new Decimal(0.5),
  canBuyMax() {}, // Only needed for static layers with buy max
  gainMult() {
    // Calculate the multiplier for main currency from bonuses
    let mult = new Decimal(1);
    /*
    if (hasUpgrade(this.layer, 166)) mult = mult.times(2); // These upgrades don't exist
    if (hasUpgrade(this.layer, 120))
      mult = mult.times(upgradeEffect(this.layer, 120) as DecimalSource);
    */
    return mult;
  },
  gainExp() {
    // Calculate the exponent on main currency from bonuses
    return new Decimal(1);
  },
  row: 0, // Row the layer is in on the tree (0 is the first row)
  effect() {
    return {
      // Formulas for any boosts inherent to resources in the layer. Can return a single value instead of an object if there is just one effect
      waffleBoost: Decimal.pow(player.layers[this.layer].points, 0.2),
      icecreamCap: player.layers[this.layer].points.times(10)
    };
  },
  effectDisplay() {
    // Optional text to describe the effects
    const eff = this.effect as { waffleBoost: Decimal; icecreamCap: Decimal };
    const waffleBoost = eff.waffleBoost.times(
      (buyableEffect(this.layer, 11) as { first: Decimal, second: Decimal }).first
    );
    return (
      "which are boosting waffles by " +
      format(waffleBoost) +
      " and increasing the Ice Cream cap by " +
      format(eff.icecreamCap)
    );
  },
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
  milestones: {
    data: {
      0: {
        requirementDisplay: "3 Lollipops",
        done() {
          return (player.layers[this.layer].best as Decimal).gte(3);
        }, // Used to determine when to give the milestone
        effectDisplay: "Unlock the next milestone"
      },
      1: {
        requirementDisplay: "4 Lollipops",
        unlocked() {
          return hasMilestone(this.layer, 0);
        },
        done() {
          return (player.layers[this.layer].best as Decimal).gte(4);
        },
        effectDisplay: "You can toggle beep and boop (which do nothing)",
        optionsDisplay: `
					<div style="display: flex; justify-content: center">
						<Toggle :value="player.layers.c.beep" @change="value => player.layers.c.beep = value" />
						<Toggle :value="player.layers.f.boop" @change="value => player.layers.f.boop = value" />
					</div>
				`,
        style() {
          if (hasMilestone(this.layer, this.id))
            return {
              backgroundColor: "#1111DD"
            };
        }
      }
    }
  },
  challenges: {
    data: {
      11: {
        name: "Fun",
        completionLimit: 3,
        challengeDescription() {
          return (
            "Makes the game 0% harder<br>" +
            challengeCompletions(this.layer, this.id) +
            "/" +
            this.completionLimit +
            " completions"
          );
        },
        unlocked() {
          return (player.layers[this.layer].best as Decimal).gt(0);
        },
        goalDescription: "Have 20 points I guess",
        canComplete() {
          return player.points.gte(20);
        },
        effect() {
          const ret = player.layers[this.layer].points.add(1).tetrate(0.02);
          return ret;
        },
        rewardDisplay() {
          return format(this.effect as Decimal) + "x";
        },
        countsAs: [12, 21], // Use this for if a challenge includes the effects of other challenges. Being in this challenge "counts as" being in these.
        rewardDescription: "Says hi",
        onComplete() {
          console.log("hiii");
        }, // Called when you successfully complete the challenge
        onEnter() {
          console.log("So challenging");
        },
        onExit() {
          console.log("Sweet freedom!");
        }
      }
    }
  },
  upgrades: {
    data: {
      11: {
        title: "Generator of Genericness",
        description: "Gain 1 Point every second.",
        cost: new Decimal(1),
        unlocked() {
          return player.layers[this.layer].unlocked;
        } // The upgrade is only visible when this is true
      },
      12: {
        description:
          "Point generation is faster based on your unspent Lollipops.",
        cost: new Decimal(1),
        unlocked() {
          return hasUpgrade(this.layer, 11);
        },
        effect() {
          // Calculate bonuses from the upgrade. Can return a single value or an object with multiple values
          let ret = player.layers[this.layer].points
            .add(1)
            .pow(
              player.layers[this.layer].upgrades!.includes(24)
                ? 1.1
                : player.layers[this.layer].upgrades!.includes(14)
                ? 0.75
                : 0.5
            );
          if (ret.gte("1e20000000")) ret = ret.sqrt().times("1e10000000");
          return ret;
        },
        effectDisplay() {
          return format(this.effect as Decimal) + "x";
        } // Add formatting to the effect
      },
      13: {
        unlocked() {
          return hasUpgrade(this.layer, 12);
        },
        onPurchase() {
          // This function triggers when the upgrade is purchased
          player.layers[this.layer].unlockOrder = 0;
        },
        style() {
          if (hasUpgrade(this.layer, this.id))
            return {
              "background-color": "#1111dd"
            };
          else if (!this.canAfford) {
            return {
              "background-color": "#dd1111"
            };
          } // Otherwise use the default
        },
        canAfford() {
          return player.points.lte(7);
        },
        pay() {
          player.points = player.points.add(7);
        },
        fullDisplay:
          "Only buyable with less than 7 points, and gives you 7 more. Unlocks a secret subtab."
      },
      22: {
        title: "This upgrade doesn't exist",
        description: "Or does it?.",
        currencyLocation() {
          return player.layers[this.layer].buyables;
        }, // The object in player data that the currency is contained in
        currencyDisplayName: "exhancers", // Use if using a nonstandard currency
        currencyInternalName: 11, // Use if using a nonstandard currency

        cost: new Decimal(3),
        unlocked() {
          return player.layers[this.layer].unlocked;
        } // The upgrade is only visible when this is true
      }
    }
  },
  buyables: {
    showBRespecButton: true,
    respec() {
      // Optional, reset things and give back your currency. Having this function makes a respec button appear
      player.layers[this.layer].points = player.layers[this.layer].points.add(
        player.layers[this.layer].spentOnBuyables as Decimal
      ); // A built-in thing to keep track of this but only keeps a single value
      this.reset();
      resetLayer(this.layer, true); // Force a reset
    },
    respecButtonDisplay: "Respec Thingies", // Text on Respec button, optional
    respecWarningDisplay:
      "Are you sure? Respeccing these doesn't accomplish much.",
    data: {
      11: {
        title: "Exhancers", // Optional, displayed at the top in a larger font
        cost() {
          // cost for buying xth buyable, can be an object if there are multiple currencies
          let x = this.amount;
          if (x.gte(25)) x = x.pow(2).div(25);
          const cost = Decimal.pow(2, x.pow(1.5));
          return cost.floor();
        },
        effect() {
          // Effects of owning x of the items, x is a decimal
          const x = this.amount;
          const eff = {} as { first?: Decimal; second?: Decimal };
          if (x.gte(0)) eff.first = Decimal.pow(25, x.pow(1.1));
          else eff.first = Decimal.pow(1 / 25, x.times(-1).pow(1.1));

          if (x.gte(0)) eff.second = x.pow(0.8);
          else
            eff.second = x
              .times(-1)
              .pow(0.8)
              .times(-1);
          return eff;
        },
        display() {
          // Everything else displayed in the buyable button after the title
          return (
            "Cost: " +
            format(this.cost!) +
            " lollipops\n\
					Amount: " +
            player.layers[this.layer].buyables![this.id] +
            "/4\n\
					Adds + " +
            format((this.effect as { first: Decimal; second: Decimal }).first) +
            " things and multiplies stuff by " +
            format((this.effect as { first: Decimal; second: Decimal }).second)
          );
        },
        unlocked() {
          return player.layers[this.layer].unlocked;
        },
        canAfford() {
          return player.layers[this.layer].points.gte(this.cost!);
        },
        buy() {
          const cost = this.cost!;
          player.layers[this.layer].points = player.layers[
            this.layer
          ].points.sub(cost);
          player.layers[this.layer].buyables![this.id] = player.layers[
            this.layer
          ].buyables![this.id].add(1);
          player.layers[this.layer].spentOnBuyables = (player.layers[
            this.layer
          ].spentOnBuyables as Decimal).add(cost); // This is a built-in system that you can use for respeccing but it only works with a single Decimal value
        },
        buyMax() {}, // You'll have to handle this yourself if you want
        style: { height: "222px" },
        purchaseLimit: new Decimal(4),
        sellOne() {
          const amount = getBuyableAmount(this.layer, this.id)!;
          if (amount.lte(0)) return; // Only sell one if there is at least one
          setBuyableAmount(this.layer, this.id, amount.sub(1));
          player.layers[this.layer].points = player.layers[
            this.layer
          ].points.add(this.cost!);
        }
      }
    }
  },
  onReset(resettingLayer: string) {
    // Triggers when this layer is being reset, along with the layer doing the resetting. Not triggered by lower layers resetting, but is by layers on the same row.
    if (
      layers[resettingLayer].row != undefined &&
      this.row != undefined &&
      layers[resettingLayer].row! > this.row!
    )
      resetLayerData(this.layer, ["points"]); // This is actually the default behavior
  },
  automate() {}, // Do any automation inherent to this layer if appropriate
  resetsNothing() {
    return false;
  },
  onPrestige() {
    return;
  }, // Useful for if you gain secondary resources or have other interesting things happen to this layer when you reset it. You gain the currency after this function ends.

  hotkeys: [
    {
      key: "c",
      description: "reset for lollipops or whatever",
      press() {
        if (layers[this.layer].canReset) resetLayer(this.layer);
      }
    },
    {
      key: "ctrl+c",
      description: "respec things",
      press() {
        layers[this.layer].buyables!.respec!();
      },
      unlocked() {
        return hasUpgrade("c", "22");
      }
    }
  ],
  increaseUnlockOrder: [], // Array of layer names to have their order increased when this one is first unlocked

  microtabs: {
    stuff: {
      data: {
        first: {
          display: `
						<upgrades />
						<div>confirmed</div>`
        },
        second: {
          embedLayer: "f"
        }
      }
    },
    otherStuff: {
      // There could be another set of microtabs here
      data: {}
    }
  },

  bars: {
    data: {
      longBoi: {
        fillStyle: { "background-color": "#FFFFFF" },
        baseStyle: { "background-color": "#696969" },
        textStyle: { color: "#04e050" },

        borderStyle() {
          return {};
        },
        direction: Direction.Right,
        width: 300,
        height: 30,
        progress() {
          return player.points
            .add(1)
            .log(10)
            .div(10)
            .toNumber();
        },
        display() {
          return format(player.points) + " / 1e10 points";
        },
        unlocked: true
      },
      tallBoi: {
        fillStyle: { "background-color": "#4BEC13" },
        baseStyle: { "background-color": "#000000" },
        textStyle: { "text-shadow": "0px 0px 2px #000000" },

        borderStyle() {
          return { "border-width": "7px" };
        },
        direction: Direction.Up,
        width: 50,
        height: 200,
        progress() {
          return player.points.div(100);
        },
        display() {
          return formatWhole(player.points.div(1).min(100)) + "%";
        },
        unlocked: true
      },
      flatBoi: {
        fillStyle: { "background-color": "#FE0102" },
        baseStyle: { "background-color": "#222222" },
        textStyle: { "text-shadow": "0px 0px 2px #000000" },

        borderStyle() {
          return {};
        },
        direction: Direction.Up,
        width: 100,
        height: 30,
        progress() {
          return player.layers.c.points.div(50);
        },
        unlocked: true
      }
    }
  },

  // Optional, lets you format the tab yourself by listing components. You can create your own components in v.js.
  subtabs: {
    "main tab": {
      buttonStyle() {
        return { color: "orange" };
      },
      notify: true,
      display: `
				<main-display />
				<sticky><prestige-button /></sticky>
				<resource-display />
				<spacer height="5px" />
				<button onclick='console.log("yeet")'>'HI'</button>
				<div>Name your points!</div>
				<TextField :value="player.layers.c.thingy" @change="value => player.layers.c.thingy = value" :field="false" />
				<sticky style="color: red; font-size: 32px; font-family: Comic Sans MS;">I have {{ format(player.points) }} {{ player.layers.c.thingy }} points!</sticky>
				<hr />
				<milestones />
				<spacer />
				<upgrades />
				<challenges />`,
      glowColor: "blue"
    },
    thingies: {
      resetNotify: true,
      style() {
        return { "background-color": "#222222", "--background": "#222222" };
      },
      buttonStyle() {
        return { "border-color": "orange" };
      },
      display: `
				<buyables />
				<spacer />
				<row style="width: 600px; height: 350px; background-color: green; border-style: solid;">
					<Toggle :value="player.layers.c.beep" @change="value => player.layers.c.beep = value" />
					<spacer width="30px" height="10px" />
					<div>Beep</div>
					<spacer />
					<vr height="200px"/>
					<column>
						<prestige-button style="width: 150px; height: 80px" />
						<prestige-button style="width: 100px; height: 150px" />
					</column>
				</row>
				<spacer />
				<img src="https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png" />`
    },
    jail: {
      display: `
				<infobox id="coolInfo" />
				<bar id="longBoi" />
				<spacer />
				<row>
					<column style="background-color: #555555; padding: 15px">
						<div style="color: teal">Sugar level:</div><spacer /><bar id="tallBoi" />
					</column>
					<spacer />
					<column>
						<div>idk</div>
						<spacer width="0" height="50px" />
						<bar id="flatBoi" />
					</column>
				</row>
				<spacer />
				<div>It's jail because "bars"! So funny! Ha ha!</div>
				<tree :nodes="[['f', 'c'], ['g', 'spook', 'h']]" />`
    },
    illuminati: {
      unlocked() {
        return hasUpgrade("c", 13);
      },
      display: `
				<h1> C O N F I R M E D </h1>
				<spacer />
				<microtab family="stuff" style="width: 660px; height: 370px; background-color: brown; --background: brown; border: solid white; margin: auto" />
				<div>Adjust how many points H gives you!</div>
				<Slider :value="player.layers.c.otherThingy" @change="value => player.layers.c.otherThingy = value" :min="1" :max="30" />`
    }
  },
  style() {
    return {
      //'background-color': '#3325CC'
    };
  },
  nodeStyle() {
    return {
      // Style on the layer node
      color: "#3325CC",
      "text-decoration": "underline"
    };
  },
  glowColor: "orange", // If the node is highlighted, it will be this color (default is red)
  componentStyles: {
    challenge() {
      return { height: "200px" };
    },
    "prestige-button"() {
      return { color: "#AA66AA" };
    }
  },
  tooltip() {
    // Optional, tooltip displays when the layer is unlocked
    let tooltip = "{{ formatWhole(player.layers.c.points) }} {{ layers.c.resource }}";
    if (player.layers[this.layer].buyables![11].gt(0))
      tooltip +=
        "<br><i><br><br><br>{{ formatWhole(player.layers.c.buyables![11]) }} Exhancers</i>";
    return tooltip;
  },
  shouldNotify() {
    // Optional, layer will be highlighted on the tree if true.
    // Layer will automatically highlight if an upgrade is purchasable.
    return player.layers.c.buyables![11] == new Decimal(1);
  },
  mark: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
  resetDescription: "Melt your points into "
} as RawLayer;
