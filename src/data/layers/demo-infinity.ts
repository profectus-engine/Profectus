/* eslint-disable */
import { layers } from "@/game/layers";
import player from "@/game/player";
import { Layer, RawLayer } from "@/typings/layer";
import Decimal, { format } from "@/util/bignum";
import {
  getBuyableAmount, hasChallenge, hasMilestone, hasUpgrade, setBuyableAmount
} from "@/util/features";
import { resetLayer } from "@/util/layers";

export default {
  id: "i",
  position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
  startData() {
    return {
      unlocked: false,
      points: new Decimal(0)
    };
  },
  branches: ["p"],
  color: "#964B00",
  requires() {
    const require = new Decimal(8).plus(
      player.layers.i.points
        .div(10)
        .floor()
        .times(2)
    );
    return require;
  }, // Can be a function that takes requirement increases into account
  effectDisplay() {
    return (
      "Multiplying points and prestige points by " +
      format(
        player.layers[this.layer].points
          .plus(1)
          .pow(hasUpgrade("p", 235) ? 6.942 : 1)
      )
    );
  },
  resource: "Infinity", // Name of prestige currency
  baseResource: "pointy points", // Name of resource prestige is based on
  baseAmount() {
    return player.layers.p.buyables![21];
  }, // Get the current amount of baseResource
  type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
  resetGain() {
    if (hasMilestone("p", 12)) {
      return getBuyableAmount("p", 21)!
        .div(2)
        .floor()
        .times(2)
        .times(5)
        .sub(30)
        .sub(player.layers.i.points);
    }
    return player.layers.p.buyables![21].gte(layers.i.requires!) ? 1 : 0;
  }, // Prestige currency exponent
  getNextAt() {
    return new Decimal(100);
  },
  canReset() {
    return player.layers.p.buyables![21].gte(layers.i.requires!);
  },
  prestigeButtonDisplay() {
    return (
      "Reset everything for +" +
      format(layers.i.resetGain) +
      " Infinity.<br>You need " +
      format(layers.i.requires!) +
      " pointy points to reset."
    );
  },
  row: 1, // Row the layer is in on the tree (0 is the first row)
  hotkeys: [
    {
      key: "i",
      description: "I: Infinity",
      press() {
        if (layers.i.canReset) resetLayer(this.layer);
      }
    }
  ],
  layerShown() {
    return (
      player.layers[this.layer].unlocked ||
      new Decimal(player.layers.p.buyables[21]).gte(8)
    );
  },
  milestones: {
    data: {
      0: {
        requirementDisplay: "2 Infinity points",
        effectDisplay: "Keep ALL milestones on reset",
        done() {
          return player.layers[this.layer].points.gte(2);
        }
      },
      1: {
        requirementDisplay: "3 Infinity points",
        effectDisplay: "Pointy points don't reset generators",
        done() {
          return player.layers[this.layer].points.gte(3);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      },
      2: {
        requirementDisplay: "4 Infinity points",
        effectDisplay:
          "Start with 6 <b>Time Dilation</b>, 3 <b>Point</b>, and 1 of the other 2 challenges",
        done() {
          return player.layers[this.layer].points.gte(4);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      },
      3: {
        requirementDisplay: "5 Infinity points",
        effectDisplay: "Start with 40 upgrades and 6 boosts",
        done() {
          return player.layers[this.layer].points.gte(5);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      },
      4: {
        requirementDisplay: "6 Infinity points",
        effectDisplay:
          "You can choose all of the 14th row upgrades, and remove the respec button",
        done() {
          return player.layers[this.layer].points.gte(6);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      },
      5: {
        requirementDisplay: "8 Infinity points",
        effectDisplay: "Keep all upgrades and 7 Time dilation",
        done() {
          return player.layers[this.layer].points.gte(8);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      },
      6: {
        requirementDisplay: "10 Infinity points",
        effectDisplay: "Infinity reset nothing and auto prestige",
        done() {
          return player.layers[this.layer].points.gte(10);
        },
        unlocked() {
          return hasMilestone(this.layer, Number(this.id) - 1);
        }
      }
    }
  },
  resetsNothing() {
    return hasMilestone(this.layer, 6);
  },
  update(this: Layer) {
    if (hasMilestone(this.layer, 0)) {
      if (!hasMilestone("p", 0)) {
        player.layers.p.milestones!.push(0);
        player.layers.p.milestones!.push(1);
        player.layers.p.milestones!.push(2);
        player.layers.p.milestones!.push(3);
        player.layers.p.milestones!.push(4);
        player.layers.p.milestones!.push(5);
        player.layers.p.milestones!.push(6);
        player.layers.p.milestones!.push(7);
        player.layers.p.milestones!.push(8);
      }
    }
    if (hasMilestone(this.layer, 2)) {
      if (!hasChallenge("p", 11)) {
        player.layers.p.challenges![11] = new Decimal(
          hasMilestone(this.layer, 5) ? 7 : 6
        );
        player.layers.p.challenges![12] = new Decimal(3);
        player.layers.p.challenges![21] = new Decimal(1);
        player.layers.p.challenges![22] = new Decimal(1);
      }
    }
    if (hasMilestone(this.layer, 3)) {
      if (!hasUpgrade("p", 71)) {
        player.layers.p.upgrades = [
          11,
          12,
          13,
          14,
          21,
          22,
          23,
          24,
          31,
          32,
          33,
          34,
          41,
          42,
          43,
          44,
          51,
          52,
          53,
          54,
          61,
          62,
          63,
          64,
          71,
          72,
          73,
          74,
          81,
          82,
          83,
          84,
          91,
          92,
          93,
          94,
          101,
          102,
          103,
          104
        ];
      }
      if (getBuyableAmount("p", 11)!.lt(6)) {
        setBuyableAmount("p", 11, new Decimal(6));
      }
    }
    if (hasUpgrade(this.layer, 13)) {
      for (
        let i = 0;
        i < (hasUpgrade("p", 222) ? 100 : hasUpgrade("p", 215) ? 10 : 1);
        i++
      ) {
        if (layers.p.buyables!.data[12].canAfford) layers.p.buyables!.data[12].buy();
        if (layers.p.buyables!.data[13].canAfford) layers.p.buyables!.data[13].buy();
        if (
          layers.p.buyables!.data[14].canAfford &&
          layers.p.buyables!.data[14].unlocked
        )
          layers.p.buyables!.data[14].buy();
        if (layers.p.buyables!.data[21].canAfford) layers.p.buyables!.data[21].buy();
      }
    }
    if (hasUpgrade("p", 223)) {
      if (hasMilestone("p", 14))
        player.layers.p.buyables![22] = player.layers.p.buyables![22].max(
          player.layers.p.buyables![21].sub(7)
        );
      else if (layers.p.buyables!.data[22].canAfford) layers.p.buyables!.data[22].buy();
    }
    if (hasMilestone(this.layer, 5) && !hasUpgrade("p", 111)) {
      player.layers.p.upgrades = [
        11,
        12,
        13,
        14,
        21,
        22,
        23,
        24,
        31,
        32,
        33,
        34,
        41,
        42,
        43,
        44,
        51,
        52,
        53,
        54,
        61,
        62,
        63,
        64,
        71,
        72,
        73,
        74,
        81,
        82,
        83,
        84,
        91,
        92,
        93,
        94,
        101,
        102,
        103,
        104,
        111,
        121,
        122,
        131,
        132,
        141,
        142,
        143
      ];
    }
    if (hasMilestone(this.layer, 6)) {
      this.reset();
    }
  },
  upgrades: {
    rows: 999,
    cols: 5,
    data: {
      11: {
        title: "Prestige",
        description: "Gain 100% of prestige points per second",
        cost() {
          return new Decimal(1);
        },
        unlocked() {
          return hasMilestone(this.layer, 4);
        }
      },
      12: {
        title: "Automation",
        description: "Remove the nerf of upgrade <b>Active</b>",
        cost() {
          return new Decimal(2);
        },
        unlocked() {
          return hasUpgrade(this.layer, 11);
        }
      },
      13: {
        title: "Pointy",
        description: "Automatically buy generators and pointy points",
        cost() {
          return new Decimal(5);
        },
        unlocked() {
          return hasUpgrade(this.layer, 11);
        }
      }
    }
  }
} as RawLayer;
