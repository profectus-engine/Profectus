import Decimal from '../../../util/bignum';
import { player } from '../../../store/proxies';

export default {
    id: "a",
    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},
    color: "yellow",
    modal: true,
    name: "Achievements",
    resource: "achievement power",
    row: "side",
    tooltip() { // Optional, tooltip displays when the layer is locked
        return ("Achievements")
    },
    achievementPopups: true,
    achievements: {
        11: {
            image: "https://unsoftcapped2.github.io/The-Modding-Tree-2/discord.png",
            name: "Get me!",
            done() {return true}, // This one is a freebie
            goalTooltip: "How did this happen?", // Shows when achievement is not completed
            doneTooltip: "You did it!", // Showed when the achievement is completed
        },
        12: {
            name: "Impossible!",
            done() {return false},
            goalTooltip: "Mwahahaha!", // Shows when achievement is not completed
            doneTooltip: "HOW????", // Showed when the achievement is completed
            style: {'color': '#04e050'},
        },
        13: {
            name: "EIEIO",
            done() {return player.f.points.gte(1)},
            tooltip: "Get a farm point.\n\nReward: The dinosaur is now your friend (you can max Farm Points).", // Showed when the achievement is completed
            onComplete() {console.log("Bork bork bork!")}
        },
    },
    midsection: "<grid id='test' />",
    grids: {
        test: {
            maxRows: 3,
            rows: 2,
            cols: 2,
            getStartData(cell) {
                return cell
            },
            getUnlocked() { // Default
                return true
            },
            getCanClick() {
                return player.points.eq(10)
            },
            getStyle(cell, data) {
                return {'background-color': '#'+ (data*1234%999999)}
            },
            onClick() { // Don't forget onHold
                this.data++
            },
            getTitle(cell) {
                return "Gridable #" + cell
            },
            getDisplay(cell, data) {
                return data
            },
        }
    },
}
