import Decimal, { format } from '../../util/bignum';
import { player } from '../../store/proxies';
import { layers } from '../../store/layers';
import { hasUpgrade, hasMilestone, getBuyableAmount, setBuyableAmount, hasChallenge } from '../../util/features';
import { resetLayer } from '../../util/layers';

export default {
	id: "p",
	position: 0,
	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		gp: new Decimal(0),
		g: new Decimal(0),
		geff: new Decimal(1),
		cmult: new Decimal(1),
	}},
	color: "#4BDC13",
	requires(){
		let require = new Decimal(68.99)
		if (hasMilestone(this.layer,0))require=require.plus(0.01)
		if (hasUpgrade(this.layer,21))require=require.tetrate(hasUpgrade("p",34)?(new Decimal(1).div(new Decimal(1).plus(layers.p.upgrades[34].effect()))):1)
		if (hasUpgrade(this.layer,22))require=require.pow(hasUpgrade("p",34)?(new Decimal(1).div(new Decimal(1).plus(layers.p.upgrades[34].effect()))):1)
		if (hasUpgrade(this.layer,23))require=require.div(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect())):1)
		if (hasUpgrade(this.layer,24))require=require.sub(hasUpgrade("p",34)?(new Decimal(1).plus(layers.p.upgrades[34].effect())):1)
		return require.max(1)
	},
	resource: "prestige points",
	baseResource: "points",
	baseAmount() {return player.points}, // Get the current amount of baseResource
	type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
	exponent: 0.5, // Prestige currency exponent
	gainMult() { // Calculate the multiplier for main currency from bonuses
		let mult = new Decimal(1)
		if (hasUpgrade(this.layer,131))mult=mult.times(10)
			if (player.i.unlocked)mult=mult.times(player.i.points.plus(1).pow(hasUpgrade("p",235)?6.9420:1))
				if (hasUpgrade(this.layer,222))mult=mult.times(getBuyableAmount(this.layer,22).plus(1))
					if (hasUpgrade("p",231)){
						let asdf = (hasUpgrade("p",132)?player.p.gp.plus(1).pow(new Decimal(1).div(2)):hasUpgrade("p",101)?player.p.gp.plus(1).pow(new Decimal(1).div(3)):hasUpgrade("p",93)?player.p.gp.plus(1).pow(0.2):player.p.gp.plus(1).log10())
						mult=mult.mul(asdf.plus(1))
					}
					if (hasMilestone(this.layer,13))mult=mult.mul(new Decimal(2).plus(layers.p.buyables[33].effect()).pow(getBuyableAmount(this.layer,32)))
						return mult
				},
	gainExp() { // Calculate the exponent on main currency from bonuses
		return new Decimal(1)
	},
	row: 0, // Row the layer is in on the tree (0 is the first row)
	hotkeys: [
	{key: "p", description: "P: Reset for prestige points", press(){if (layers.p.canReset) resetLayer(this.layer)}},
	],
	layerShown(){return true},
	upgrades:{
		rows: 999,
		cols: 5,
		11:{
			title: "Gain points",
			description: "Point generation is increased by 1",
			cost(){
				if (hasMilestone(this.layer,2))return new Decimal(1)
					return new Decimal(1.00001)},
				unlocked(){return true}
			},
			12:{
				title: "Gain more points",
				description: "Point generation is singled",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,11)}
			},
			13:{
				title: "Gain more points",
				description: "Point generation is lined",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,12)}
			},
			14:{
				title: "Gain more points",
				description: "Point generation is tetrated by 1",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,13)}
			},
			21:{
				title: "Lower prestige requirement",
				description: "Prestige point requirement is superrooted by 1",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,14)}
			},
			22:{
				title: "Lower prestige requirement more",
				description: "Prestige point requirement is line rooted",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,21)}
			},
			23:{
				title: "Lower prestige requirement more",
				description: "Prestige point requirement is wholed",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,22)}
			},
			24:{
				title: "Lower prestige requirement more",
				description: "Prestige point requirement is decreased by 1",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,23)}
			},
			31:{
				title: "Unlock",
				description: "Unlock an upgrade",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,24)}
			},
			32:{
				title: "An",
				description: "Unlock an upgrade",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,31)}
			},
			33:{
				title: "Upgrade",
				description: "Unlock an upgrade",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,32)}
			},
			34:{
				title: "Increase",
				description(){return "Add 0.01 to all above upgrades. Currently: +"+format(this.effect())},
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,33)},
				effect(){
					let r = (hasUpgrade("p",41)?new Decimal(0.01).times(layers.p.upgrades[41].effect()):new Decimal(0.01))
					r=r.times(new Decimal(1).plus(new Decimal(player[this.layer].challenges[11]+1).pow(hasUpgrade(this.layer,121)?1.2:1)))
					if (hasUpgrade(this.layer,92)) r=r.plus(new Decimal(0.001).times(player[this.layer].g.plus(1)).min(0.05))
						return r
				}
			},
			41:{
				title: "Increase again",
				description(){return "Multiply the previous upgrade by 1.01. Currently: x"+format(this.effect())},
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,34)},
				effect(){return new Decimal(1.01).pow(hasUpgrade("p",42)?layers.p.upgrades[42].effect():1).times(hasUpgrade("p",63)?2:1)}
			},
			42:{
				title: "Increase again",
				description(){return "Exponentiate the previous upgrade by 1.01. Currently: ^"+format(this.effect())},
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,41)},
				effect(){return new Decimal(1.01).tetrate(hasUpgrade("p",43)?layers.p.upgrades[43].effect():1).times(hasUpgrade("p",63)?2:1).times(hasUpgrade("p",64)?2:1)}
			},
			43:{
				title: "Increase again",
				description(){return "Tetrate the previous upgrade by 1.01. Currently: ^^"+format(this.effect())},
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,42)},
				effect(){return new Decimal(1.01).pentate(hasUpgrade("p",44)?layers.p.upgrades[44].effect():1).times(hasUpgrade("p",63)?2:1).times(hasUpgrade("p",64)?2:1)}
			},
			44:{
				title: "Increase again",
				description(){return "Pentate the previous upgrade by 1.01. Currently: ^^^"+format(this.effect())},
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,43)},
				effect(){return new Decimal(1.01).times(hasUpgrade("p",63)?2:1).times(hasUpgrade("p",64)?2:1)}
			},
			51:{
				title: "Challenging",
				description: "This upgrade doesn't unlock a challenge",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,44)},
			},
			52:{
				title: "Not challenging",
				description: "This upgrade doesn't add 1 to the completion limit",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,51)},
			},
			53:{
				title: "Not not challenging",
				description: "This upgrade doesn't add 1 to the completion limit",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,52)},
			},
			54:{
				title: "(not^3) challenging",
				description: "Fix the bug where you can't buy upgrades when you have 1 prestige point",
				cost(){return new Decimal(0.99999)},
				unlocked(){return hasUpgrade(this.layer,53)},
				onPurchase(){player.p.points=player.p.points.round()},
			},
			61:{
				title: "(not^4) challenging",
				description: "Doesn't unlock a second challenge",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,54)&&hasUpgrade(this.layer,53)},
			},
			62:{
				title: "Infinity points",
				description: "You can now complete Time Dilation 4 more times",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,61)},
			},
			63:{
				title: "Eternity points",
				description: "Double all fourth row upgrade effects",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,62)},
			},
			64:{
				title: "Reality points",
				description: "Previous upgrade, but only to the last 3 upgrades",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,63)},
			},
			71:{
				title: "1",
				description: "Add 1.1 to point gain, but reset all above upgrades",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,64)},
				onPurchase(){if (!hasMilestone(this.layer,0)) player[this.layer].upgrades=[71]}
			},
			72:{
				title: "2",
				description: "Multiply point gain by 1.1, but reset all above upgrades",
				cost(){return new Decimal(2)},
				unlocked(){return hasUpgrade(this.layer,64)&&hasUpgrade(this.layer, this.id-1)},
				onPurchase(){if (!hasMilestone(this.layer,1))player[this.layer].upgrades=[71,72]}
			},
			73:{
				title: "3",
				description: "Raise point gain by ^1.1, but reset all above upgrades",
				cost(){return new Decimal(4)},
				unlocked(){return hasUpgrade(this.layer,64)&&hasUpgrade(this.layer, this.id-1)},
				onPurchase(){if (!hasMilestone(this.layer,1))player[this.layer].upgrades=[71,72,73]}
			},
			74:{
				title: "4",
				description: "Tetrate point gain by 1.1, but reset all above upgrades",
				cost(){return new Decimal(8)},
				unlocked(){return hasUpgrade(this.layer,64)&&hasUpgrade(this.layer, this.id-1)},
				onPurchase(){if (!hasMilestone(this.layer,2))player[this.layer].upgrades=[71,72,73,74]
					if (hasMilestone(this.layer,1)&&!hasMilestone(this.layer,2)) {player[this.layer].upgrades=[11,12,13,14,21,22,23,24,71,72,73,74]}}
				},
			81:{
				title: "5",
				description: "Generator efficiency is increased by 2",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,74)&&(player[this.layer].buyables[12].gt(0)||player[this.layer].buyables[21].gt(0))},
			},
			82:{
				title: "6",
				description: "Unlock another way to buy generators",
				cost(){return new Decimal(1)},
				unlocked(){return hasUpgrade(this.layer,81)&&(player[this.layer].buyables[12].gt(0)||player[this.layer].buyables[21].gt(0))},
			},
			83:{
				title: "7",
				description: "Generator efficiency is boosted by prestige points",
				cost(){return new Decimal(3)},
				unlocked(){return hasUpgrade(this.layer,82)},
			},
			84:{
				title: "8",
				description: "You can complete <b>Point</b> one more time",
				cost(){return new Decimal(3)},
				unlocked(){return hasUpgrade(this.layer,83)},
			},
			91:{
				title: "9",
				description: "New Challenge Time",
				cost(){return new Decimal(20)},
				unlocked(){return hasUpgrade(this.layer,84)&&new Decimal(player[this.layer].challenges[12]).gte(3)},
			},
			92:{
				title: "10",
				description: "Each of the first 50 generators adds 0.001 to <b>Increase</b>",
				cost(){return new Decimal(5)},
				unlocked(){return hasUpgrade(this.layer,91)&&hasChallenge(this.layer,21)},
			},
			93:{
				title: "11",
				description: "Change the tree trunk in generator effect to a hypertessaract root",
				cost(){return new Decimal(7)},
				unlocked(){return hasUpgrade(this.layer,92)},
			},
			94:{
				title: "12",
				description: "Unlock a clickable in generators",
				cost(){return new Decimal(50)},
				unlocked(){return hasUpgrade(this.layer,93)},
			},
			101:{
				title: "10th row????",
				description: "Decrease the dimensions of <b>11</b> by 2",
				cost(){return new Decimal(10)},
				unlocked(){return hasUpgrade(this.layer,94)},
			},
			102:{
				title: "2 Tree Trunks",
				description: "Double log of generator points adds to generator efficiency",
				cost(){return new Decimal(25)},
				unlocked(){return hasUpgrade(this.layer,101)},
			},
			103:{
				title: "(not^5) challenging",
				description: "Unlock the last challenge",
				cost(){return new Decimal(103)},
				unlocked(){return hasUpgrade(this.layer,102)},
			},
			104:{
				title: "2 layers tree",
				description: "Prestige points boost points, and unlock another tab",
				cost(){return new Decimal(100)},
				unlocked(){return hasUpgrade(this.layer,103)&&hasChallenge(this.layer,22)},
			},
			111:{
				title: "not (hardcapped)",
				description: "Remove the generator clickable hardcap, and you can only pick one upgrade on each row below this",
				cost(){return new Decimal(110)},
				unlocked(){return hasUpgrade(this.layer,104)&&hasMilestone(this.layer,6)},
			},
			112:{
				title: "Respec button",
				description: "Respec all lower upgrades, but you don't get points back",
				cost(){return new Decimal(100)},
				unlocked(){return hasUpgrade(this.layer,111)&&(hasUpgrade(this.layer,121)||hasUpgrade(this.layer,122))&&!hasMilestone("i",4)},
				onPurchase(){
					player.p.upgrades=player.p.upgrades.filter(function x(i){return i<112})
				}
			},
			121:{
				title: "Timers",
				description: "Raise the <b>Time Dilation</b> reward effect to the 1.2",
				cost(){return new Decimal(500)},
				unlocked(){return hasUpgrade(this.layer,111)&&(!hasUpgrade(this.layer,122)||hasMilestone(this.layer,7))},
			},
			122:{
				title: "Generators",
				description: "Decrease the first generator buyable cost scaling base by 2",
				cost(){return new Decimal(500)},
				unlocked(){return hasUpgrade(this.layer,111)&&(!hasUpgrade(this.layer,121)||hasMilestone(this.layer,7))},
			},
			131:{
				title: "Prestige",
				description: "Gain 10x more prestige points",
				cost(){return new Decimal(5000)},
				unlocked(){return (hasUpgrade(this.layer,121)||hasUpgrade(this.layer,122))&&(!hasUpgrade(this.layer,132)||hasMilestone(this.layer,7))},
			},
			132:{
				title: "One and a half",
				description: "Raise generator effect to the 1.5",
				cost(){return new Decimal(5000)},
				unlocked(){return (hasUpgrade(this.layer,121)||hasUpgrade(this.layer,122))&&(!hasUpgrade(this.layer,131)||hasMilestone(this.layer,7))},
			},

			141:{
				title: "Active",
				description: "Multiply generator efficiency now increases by 1, but it doesn't automatically click.",
				cost(){return new Decimal(50000)},
				unlocked(){return (hasUpgrade(this.layer,131)||hasUpgrade(this.layer,132))&&((!hasUpgrade(this.layer,142)&&!hasUpgrade(this.layer,143))||hasMilestone("i",4))},
			},
			142:{
				title: "Passive",
				description: "Gain 5x more points",
				cost(){return new Decimal(50000)},
				unlocked(){return (hasUpgrade(this.layer,131)||hasUpgrade(this.layer,132))&&((!hasUpgrade(this.layer,141)&&!hasUpgrade(this.layer,143))||hasMilestone("i",4))},
			},
			143:{
				title: "Idle",
				description: "Hours played multiply generator power",
				cost(){return new Decimal(50000)},
				unlocked(){return (hasUpgrade(this.layer,131)||hasUpgrade(this.layer,132))&&((!hasUpgrade(this.layer,142)&&!hasUpgrade(this.layer,141))||hasMilestone("i",4))},
			},
			211:{
				title: "Prestige",
				description: "Pointy points multiply points",
				cost(){return new Decimal(1)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades")},
			},
			212:{
				title: "Pointy",
				description: "Pointy prestige points reduce the cost scaling of pointy points",
				cost(){return new Decimal(2)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,211))},
			},
			213:{
				title: "Time",
				description: "Generator power also multiplies point gain",
				cost(){return new Decimal(6)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,212))},
			},
			214:{
				title: "^0",
				description: "Further reduce the pointy point scaling",
				cost(){return new Decimal(11)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,213))},
			},
			215:{
				title: "bulk",
				description: "Auto-pointy points now buys 10 per tick",
				cost(){return new Decimal(27)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,214))},
			},
			221:{
				title: "^-1",
				description: "^0 is even more powerful",
				cost(){return new Decimal(28)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,215))},
			},
			222:{
				title: "???",
				description: "square <b>bulk</b> and pointy prestige points multiply prestige points",
				cost(){return new Decimal(90)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,221))},
			},
			223:{
				title: "more automation",
				description: "Automatically gain pointy prestige points",
				cost(){return new Decimal(96)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,222))},
			},
			224:{
				title: "Generation",
				description: "Generator costs are divided by generator effect",
				cost(){return new Decimal(100)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,223))},
			},
			225:{
				title: "Boosters",
				description: "Unlock boosters (next update)",
				cost(){return new Decimal(135)},
				canAfford(){return getBuyableAmount(this.layer,22).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,22,getBuyableAmount(this.layer,22).sub(this.cost()))},
				unlocked(){return (hasMilestone("i",5)&&layers.p.activeSubtab!="Upgrades"&&hasUpgrade(this.layer,224))},
			},
			231:{
				title: "Blue",
				description: "The generator effect also affects prestige points",
				cost(){return new Decimal(4)},
				canAfford(){return getBuyableAmount(this.layer,23).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,23,getBuyableAmount(this.layer,23).sub(this.cost()))},
				unlocked(){return (layers.p.activeSubtab!="Upgrades"&&hasMilestone(this.layer,11))},
				currencyDisplayName: "pointy boosters"
			},
			232:{
				title: "Red",
				description: "Unlock a third way to buy generators",
				cost(){return new Decimal(5)},
				canAfford(){return getBuyableAmount(this.layer,23).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,23,getBuyableAmount(this.layer,23).sub(this.cost()))},
				unlocked(){return (layers.p.activeSubtab!="Upgrades"&&hasMilestone(this.layer,12))},
				currencyDisplayName: "pointy boosters"
			},
			233:{
				title: "Green",
				description: "Prestige points do not reset your pointy points and boosters don't reset generators",
				cost(){return new Decimal(5)},
				canAfford(){return getBuyableAmount(this.layer,23).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,23,getBuyableAmount(this.layer,23).sub(this.cost()))},
				unlocked(){return (layers.p.activeSubtab!="Upgrades"&&hasMilestone(this.layer,12))},
				currencyDisplayName: "pointy boosters"
			},
			234:{
				title: "Yellow",
				description: "Divide the cost of the third generator buyable based on boosters",
				cost(){return new Decimal(6)},
				canAfford(){return getBuyableAmount(this.layer,23).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,23,getBuyableAmount(this.layer,23).sub(this.cost()))},
				unlocked(){return (layers.p.activeSubtab!="Upgrades"&&hasMilestone(this.layer,12))},
				currencyDisplayName: "pointy boosters"
			},
			235:{
				title: "Orange",
				description: "Raise the Infinity effect to the 6.9420th power",
				cost(){return new Decimal(8)},
				canAfford(){return getBuyableAmount(this.layer,23).gte(this.cost())},
				pay(){setBuyableAmount(this.layer,23,getBuyableAmount(this.layer,23).sub(this.cost()))},
				unlocked(){return (layers.p.activeSubtab!="Upgrades"&&hasMilestone(this.layer,12))},
				currencyDisplayName: "pointy boosters"
			},
		},

		clickables: {
			rows: 1,
			cols: 1,
			11: {

				display() {return "Multiply generator efficiency by "+format(player.p.cmult)+((player.p.cmult.min(100).eq(100)&&!hasUpgrade(this.layer,111))?" (hardcapped)":"")},
				unlocked(){return hasUpgrade("p",94)},
				click(){player.p.cmult=player.p.cmult.plus(hasUpgrade("p",141)?1:0.01)
				if (!hasUpgrade(this.layer,111))player.p.cmult=player.p.cmult.min(100)
			},
		canClick(){return player.p.cmult.lt(100)||hasUpgrade(this.layer,111)},
	},

},

challenges:{
	rows: 99,
	cols: 2,
	11:{
		name: "Time dilation",
		challengeDescription(){return "Point gain exponent is raised to the ^0.75"},
		goal(){return new Decimal(100).times(new Decimal(10).pow(new Decimal(player[this.layer].challenges[this.id]).times(new Decimal(1).sub(new Decimal(layers[this.layer].challenges[12].effect()).div(100))).pow(2)))},
		rewardDescription(){return "You have completed this challenge "+player[this.layer].challenges[this.id]+"/"+this.completionLimit()+" times. Multiply <b>Increase</b>'s effect by challenge completions+1. Currently: x"+format(new Decimal(player[this.layer].challenges[this.id]+1).pow(hasUpgrade(this.layer,121)?1.2:1))},
		unlocked(){return hasUpgrade("p",51)||hasChallenge(this.layer,this.id)},
		completionLimit(){
			if (hasUpgrade("p",62))return 7
				if (hasUpgrade("p",53))return 3
					if (hasUpgrade("p",52))return 2
						return 1

				}
			},
			12:{
				name: "Point",
				challengeDescription: "Points are pointed",
				goal(){return new Decimal(100)},
				rewardDescription(){return "You have completed this challenge "+player[this.layer].challenges[this.id]+"/"+this.completionLimit()+" times, making previous challenge goal scale "+(layers[this.layer].challenges[this.id].effect())+"% slower."},
				unlocked(){return hasUpgrade("p",61)||hasChallenge(this.layer,this.id)},
				effect(){
					if (!hasChallenge(this.layer,this.id)) return 0
						if (player[this.layer].challenges[this.id]==1) return 50
							if (player[this.layer].challenges[this.id]==2) return 60
								if (player[this.layer].challenges[this.id]==3) return 70
							},
						completionLimit(){
							let l=new Decimal(1)
							if (hasUpgrade("p",84)) l=l.plus(1)
								if (hasMilestone("p",3))l=l.plus(1)
									return l

							}
						},
						21:{
							name: "Time Points",
							challengeDescription: "You are stuck in all above challenges",
							goal(){return new Decimal(308.25)},
							rewardDescription(){return "Lower the first generator buyable cost base by 6"},
							unlocked(){return hasUpgrade("p",91)||hasChallenge(this.layer,this.id)},
						},
						22:{
							name: "Last Challenge",
							challengeDescription: "Generator points do nothing",
							goal(){return new Decimal(9999)},
							rewardDescription(){return "Autoclick the clickable and reduce <b>2 Tree Trunks</b> by 1"},
							unlocked(){return hasUpgrade("p",103)||hasChallenge(this.layer,this.id)},
						}
					},
					buyables: {
						rows: 99,
						cols: 4,
						11: {
							cost() { return new Decimal(0)},
							display() { return "Reset all upgrades and challenges, but get a boost. You have reset "+getBuyableAmount(this.layer,this.id)+" times.<br>"+(getBuyableAmount(this.layer,this.id).eq(6)?"You can't buy more than 6 boosts!":"You need all upgrades to reset.") },
							canAfford() { return (player[this.layer].points.gte(this.cost())&&hasUpgrade(this.layer,74)&&hasUpgrade(this.layer,64))&&getBuyableAmount(this.layer,this.id).lt(6) },
							buy() {
								player[this.layer].points = player[this.layer].points.sub(this.cost())
								setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
								player[this.layer].points=new Decimal(0)
								player[this.layer].upgrades=[]
								if (hasMilestone(this.layer,1))player[this.layer].upgrades=[11,12,13,14,21,22,23,24]
									if (hasMilestone(this.layer,3))player[this.layer].upgrades=[11,12,13,14,21,22,23,24,31,32,33,34,41,42,43,44,51,52,53,54,61,62,63,64]
										if (!hasMilestone(this.layer,2)){
											for (let c in layers[this.layer].challenges){
												player[this.layer].challenges[c]=0
											}
										}
									},
									unlocked(){return (hasUpgrade(this.layer,74)&&hasUpgrade(this.layer,64))||hasMilestone(this.layer,0)}
								},
								12: {
									cost() { return new Decimal(1).times(new Decimal(hasChallenge(this.layer,21)?4:10).sub(hasUpgrade(this.layer,122)?2:0).pow(player.p.buyables[this.id])).div(hasUpgrade(this.layer,224)?(hasUpgrade("p",132)?player.p.gp.plus(1).pow(new Decimal(1).div(2)):hasUpgrade("p",101)?player.p.gp.plus(1).pow(new Decimal(1).div(3)):hasUpgrade("p",93)?player.p.gp.plus(1).pow(0.2):player.p.gp.plus(1).log10()):1)},
									display() { return "Buy a generator for "+format(this.cost())+" points" },
									canAfford() { return (player.points.gte(this.cost())&&hasMilestone(this.layer,5)) },
									buy() {
										if (!hasMilestone("p",13))player.points = player.points.sub(this.cost())
											setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
										player[this.layer].g=player[this.layer].g.plus(1)
									},
									unlocked(){return (hasMilestone(this.layer,5))}
								},
								13: {
									cost() { return new Decimal(1).times(new Decimal(2).pow(player.p.buyables[this.id])).div(hasUpgrade(this.layer,224)?(hasUpgrade("p",132)?player.p.gp.plus(1).pow(new Decimal(1).div(2)):hasUpgrade("p",101)?player.p.gp.plus(1).pow(new Decimal(1).div(3)):hasUpgrade("p",93)?player.p.gp.plus(1).pow(0.2):player.p.gp.plus(1).log10()):1)},
									display() { return "Buy a generator for "+format(this.cost())+" prestige points" },
									canAfford() { return (player.p.points.gte(this.cost())&&hasUpgrade("p",82)) },
									buy() {
										if (!hasMilestone("p",13))player.p.points = player.p.points.sub(this.cost())
											setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
										player[this.layer].g=player[this.layer].g.plus(1)
									},
									unlocked(){return (hasUpgrade(this.layer,82))}
								},
								14: {
									cost() { return new Decimal(900).mul(new Decimal(1.01).pow(getBuyableAmount(this.layer,this.id))).round().div(hasUpgrade(this.layer,234)?getBuyableAmount(this.layer,23).pow(0.3).plus(1):1)},
									display() { return "Buy a generator for "+format(this.cost())+" Infinity points" },
									canAfford() { return (player.i.points.gte(this.cost())&&hasUpgrade("p",232)) },
									buy() {
										if (!hasMilestone("p",13))player.i.points = player.i.points.sub(this.cost()).round()
											setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
										player[this.layer].g=player[this.layer].g.plus(1)
									},
									unlocked(){return (hasUpgrade(this.layer,232))}
								},
								21: {
									cost() { return new Decimal(20).plus(getBuyableAmount(this.layer, this.id).pow(new Decimal(2).sub(new Decimal(hasUpgrade(this.layer,221)?0.9:hasUpgrade(this.layer,214)?0.6:0.3).times(hasUpgrade(this.layer,212)?(new Decimal(1).sub(new Decimal(0.75).pow(getBuyableAmount(this.layer,22)))):0))))},
									display() { return "Reset your generators for +1 pointy point! Cost: "+format(this.cost())+" Generators" },
									canAfford() { return (player.p.g.gte(this.cost())&&hasUpgrade("p",104)) },
									buy() {
										if (!hasMilestone("i",1))player.p.g = new Decimal(0)
											setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
										if (!hasMilestone("i",1))setBuyableAmount(this.layer,12, new Decimal(0))
											if (!hasMilestone("i",1))setBuyableAmount(this.layer,13, new Decimal(0))
												if (!hasMilestone("i",1))player.p.gp=new Decimal(0)
											},
										unlocked(){return (hasUpgrade(this.layer,104))}
									},
									22: {
										cost() { return new Decimal(8).plus(getBuyableAmount(this.layer,this.id))},
										display() { return "Gain a pointy prestige point. Cost: "+format(this.cost())+" Pointy Points" },
										canAfford() { return (getBuyableAmount(this.layer,21).gte(this.cost())&&(hasMilestone("i",5))) },
										buy() {
											if (!hasUpgrade(this.layer,233))setBuyableAmount(this.layer,21, getBuyableAmount(this.layer,21).sub(this.cost()))
												setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
										},
										unlocked(){return (hasMilestone("i",5))}
									},
									23: {
										cost() { return new Decimal(124).plus(getBuyableAmount(this.layer,this.id).times(2).pow(2))},
										display() { return "Gain a booster. Cost: "+format(this.cost())+" Pointy Points" },
										canAfford() { return (getBuyableAmount(this.layer,21).gte(this.cost())&&(hasMilestone("i",5))) },
										buy() {
											if (!hasMilestone(this.layer,15))setBuyableAmount(this.layer,21, getBuyableAmount(this.layer,21).sub(this.cost()))
												setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
											if (!hasMilestone(this.layer,15)){
												if (!hasMilestone(this.layer,12)){player.p.upgrades=player.p.upgrades.filter((x)=>{return (x<200||x>230)})
													if (hasMilestone(this.layer,11)){player.p.upgrades.push(215);player.p.upgrades.push(225);player.p.upgrades.push(223);player.p.upgrades.push(222)}}
												setBuyableAmount("p",21,new Decimal(0))
												setBuyableAmount("p",22,new Decimal(0))
												if (!hasUpgrade("p",233)){
													setBuyableAmount("p",12,new Decimal(0))
													setBuyableAmount("p",13,new Decimal(0))
													setBuyableAmount("p",14,new Decimal(0))

													player.p.g = new Decimal(0)}
													player.p.gp=new Decimal(0)}
												},
												unlocked(){return (hasUpgrade("p",225)||getBuyableAmount("p",23).gt(0))}
											},
											31: {
												cost() { return new Decimal(1e93).times(new Decimal(1.5).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(1.1).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
												effect(){return new Decimal(2).plus(layers.p.buyables[33].effect()).pow(getBuyableAmount(this.layer,this.id).plus(layers.p.buyables[51].effect()))},
												display() { return "Double point gain. \nCurrently: x"+format(this.effect())+"\nCost: "+format(this.cost())+" Prestige points" },
												canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
												buy() {
													player.p.points=player.p.points.sub(this.cost())
													setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
												},
												unlocked(){return (hasMilestone("p",13))}
											},
											32: {
												cost() { return new Decimal(1e95).times(new Decimal(2).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(1.01).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
												display() { return "Double prestige point gain. \nCurrently: x"+format(new Decimal(2).plus(layers.p.buyables[33].effect()).pow(getBuyableAmount(this.layer,this.id)))+"\nCost: "+format(this.cost())+" Prestige points" },
												canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
												buy() {
													player.p.points=player.p.points.sub(this.cost())
													setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
												},
												unlocked(){return (hasMilestone("p",13)&&getBuyableAmount(this.layer,31).gte(5))}
											},
											33: {
												cost() { return new Decimal(1e100).times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(1.01).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
												effect(){return new Decimal(0.01).mul(getBuyableAmount(this.layer,this.id)).times(layers.p.buyables[43].effect())},
												display() { return "Add 0.01 to the previous 2 buyable bases. \nCurrently: +"+format(this.effect())+"\nCost: "+format(this.cost())+" Prestige points" },
												canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
												buy() {
													player.p.points=player.p.points.sub(this.cost())
													setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
												},
												unlocked(){return (hasMilestone("p",13)&&(getBuyableAmount(this.layer,this.id).gt(0)||player.p.points.gte(1e100)))}
											},
											41: {
												cost() { return new Decimal(1e110).times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
												effect(){return new Decimal(0.01).mul(getBuyableAmount(this.layer,this.id).plus(layers.p.buyables[51].effect()))},
												display() { return "Add 0.01 to the booster effect base. \nCurrently: +"+format(this.effect())+"\nCost: "+format(this.cost())+" Prestige points" },
												canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
												buy() {
													player.p.points=player.p.points.sub(this.cost())
													setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
												},
												unlocked(){return (hasMilestone("p",13)&&(getBuyableAmount(this.layer,this.id).gt(0)||player.p.points.gte(1e110)))}
											},
											42: {
												cost() { let c =  new Decimal(1e270).times(new Decimal(2).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(1.01).pow(getBuyableAmount(this.layer,this.id).pow(2)))

													return c
												},
												effect(){
													let f= new Decimal(1.001).pow(getBuyableAmount(this.layer,this.id))
													if (f.gte(1.1))f=f.pow(0.8).times(new Decimal(1.1).pow(0.2))
														if (f.gte(1.35))f=f.pow(0.5).times(new Decimal(1.35).pow(0.5))
															if (f.gte(3))f=new Decimal(3)
																return f
														},
														display() { return "Raise point gain to the 1.001 \nCurrently: ^"+format(this.effect())+(this.effect().eq(3)?"(hardcapped)":"")+"\nCost: "+format(this.cost())+" Prestige points" },
														canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13)))&&this.effect().lt(3) },
														buy() {
															player.p.points=player.p.points.sub(this.cost())
															setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
														},
														unlocked(){return (hasMilestone("p",13)&&(getBuyableAmount(this.layer,this.id).gt(0)||player.p.points.gte(1e270)))}
													},
													43: {
														cost() { return new Decimal("1e375").times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
														effect(){return new Decimal(0.01).mul(getBuyableAmount(this.layer,this.id)).plus(1)},
														display() { return "Multiply the above buyable effect. \nCurrently: *"+format(this.effect())+"\nCost: "+format(this.cost())+" Prestige points" },
														canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
														buy() {
															player.p.points=player.p.points.sub(this.cost())
															setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
														},
														unlocked(){return (hasMilestone("p",13)&&(getBuyableAmount(this.layer,this.id).gt(0)||player.p.points.gte("1e375")))}
													},
													51: {
														cost() { return new Decimal("1e1740").times(new Decimal(10).pow(getBuyableAmount(this.layer,this.id))).times(new Decimal(1e10).pow(getBuyableAmount(this.layer,this.id).pow(2)))},
														effect(){return getBuyableAmount(this.layer,this.id).pow(0.55)},
														display() { return "Add free levels to the above 2 buyables \nCurrently: "+format(this.effect())+"\nCost: "+format(this.cost())+" Prestige points" },
														canAfford() { return (player.p.points.gte(this.cost())&&(hasMilestone("p",13))) },
														buy() {
															player.p.points=player.p.points.sub(this.cost())
															setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
														},
														unlocked(){return (hasMilestone("p",15)&&(getBuyableAmount(this.layer,this.id).gt(0)||player.p.points.gte("1e1700")))}
													},
												},
												milestones: {
													0: {
														requirementDescription: "1 reset",
														effectDescription: "Add 0.01 to base point gain and prestige requirement, and <b>1</b> doesn't reset upgrades",
														done() { return getBuyableAmount("p",11).gte(1) },
														unlocked(){return layers.p.activeSubtab!="Pointy points"}
													},
													1: {
														requirementDescription: "2 resets",
														effectDescription: "<b>2</b> and <b>3</b> don't reset upgrades, and start with the first 8 upgrades on reset",
														done() { return getBuyableAmount("p",11).gte(2) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&layers.p.activeSubtab!="Pointy points"}
													},
													2: {
														requirementDescription: "3 resets",
														effectDescription: "<b>4</b> doesn't reset upgrades, and permanently fix the bug where you can't buy upgrades when you have 1 prestige point",
														done() { return getBuyableAmount("p",11).gte(3) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&layers.p.activeSubtab!="Pointy points"}
													},
													3: {
														requirementDescription: "4 resets",
														effectDescription: "Don't reset challenges, add 1 to <b>Point</b> maximum completions, and start with 24 upgrades",
														done() { return getBuyableAmount("p",11).gte(4) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&layers.p.activeSubtab!="Pointy points"}
													},
													4: {
														requirementDescription: "5 resets",
														effectDescription: "Each useless upgrade adds 0.1 to base point gain",
														done() { return getBuyableAmount("p",11).gte(5) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&layers.p.activeSubtab!="Pointy points"}
													},
													5: {
														requirementDescription: "6 resets",
														effectDescription: "Unlock something",
														done() { return getBuyableAmount("p",11).gte(6) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&layers.p.activeSubtab!="Pointy points"}
													},
													6: {
														requirementDescription: "1 pointy point",
														effectDescription: "Unlock the upgrade tree",
														done() { return getBuyableAmount("p",21).gte(1) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&(hasUpgrade(this.layer,104)||player.i.unlocked)&&layers.p.activeSubtab!="Pointy points"}
													},
													7: {
														requirementDescription: "7 pointy points",
														effectDescription: "You can now buy both first and second row upgrade tree upgrades",
														done() { return getBuyableAmount("p",21).gte(7) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&(hasUpgrade(this.layer,111)||player.i.unlocked)&&layers.p.activeSubtab!="Pointy points"}
													},
													8: {
														requirementDescription: "8 pointy points",
														effectDescription: "Unlock another layer",
														done() { return getBuyableAmount("p",21).gte(8) },
														unlocked(){return hasMilestone(this.layer,this.id-1)&&(hasUpgrade(this.layer,141)||hasUpgrade(this.layer,143)||hasUpgrade(this.layer,142)||player.i.unlocked)&&layers.p.activeSubtab!="Pointy points"}
													},
													11: {
														requirementDescription: "3 boosters",
														effectDescription: "Keep automation on booster reset",
														done() { return getBuyableAmount("p",23).gte(3) },
														unlocked(){return (getBuyableAmount("p",23).gt(0)||hasMilestone(this.layer,this.id))}
													},
													12: {
														requirementDescription: "5 boosters",
														effectDescription: "Keep all prestige upgrades on booster reset and buy max infinity points",
														done() { return getBuyableAmount("p",23).gte(5) },
														unlocked(){return (getBuyableAmount("p",23).gt(0)||hasMilestone(this.layer,this.id))}
													},
													13: {
														requirementDescription: "10 boosters",
														effectDescription: "Generators cost nothing",
														done() { return getBuyableAmount("p",23).gte(10) },
														unlocked(){return (getBuyableAmount("p",23).gt(0)||hasMilestone(this.layer,this.id))}
													},
													14: {
														requirementDescription: "15 boosters",
														effectDescription: "Auto buy the first 3 buyables and buy max pointy prestige points",
														done() { return getBuyableAmount("p",23).gte(15) },
														unlocked(){return (getBuyableAmount("p",41).gt(0)||hasMilestone(this.layer,this.id))}
													},
													15: {
														requirementDescription: "20 boosters",
														effectDescription: "Boosters reset nothing and auto booster",
														done() { return getBuyableAmount("p",23).gte(16) },
														unlocked(){return (getBuyableAmount("p",41).gt(0)||hasMilestone(this.layer,this.id))}
													},
												},
												passiveGeneration(){return (hasUpgrade("i",11)?1:0)},
												update(diff){
													if (hasMilestone(this.layer,2)&&!hasUpgrade(this.layer,54)){
														player[this.layer].upgrades.push(54)
													}
													if (hasMilestone(this.layer,1)&&!hasUpgrade(this.layer,11)&&!hasMilestone(this.layer,3)){
														player[this.layer].upgrades=[11,12,13,14,21,22,23,24]
													}
													if (hasMilestone(this.layer,3)&&!hasUpgrade(this.layer,31)){
														player[this.layer].upgrades=[11,12,13,14,21,22,23,24,31,32,33,34,41,42,43,44,51,52,53,54,61,62,63,64]
													}
													if (hasMilestone(this.layer,5)){
														player[this.layer].gp=player[this.layer].gp.plus(player.p.g.times(diff).times(player.p.geff))
													}
													let geff=new Decimal(1)
													if (hasUpgrade("p",81)) geff=geff.plus(2)
														if (hasUpgrade("p",102)) geff=geff.plus(hasChallenge("p",22)?player.p.gp.plus(1).log(10):player.p.gp.plus(1).log(10).plus(1).log(10))
															if (hasUpgrade("p",83)) geff=geff.times(player.p.points.plus(1).log(10).plus(1))
																if (hasUpgrade("p",94)) geff=geff.times(player.p.cmult)
																	if (hasUpgrade("p",104)) geff=geff.times(new Decimal(player.p.buyables[21]).plus(1))
																		if (hasUpgrade("p",143)) geff=geff.times(new Decimal(player.timePlayed).div(3600).max(1))
																			if (hasUpgrade("p",225)) geff=geff.pow(new Decimal(player.p.buyables[23]).div(10).mul(new Decimal(0.1).plus(layers.p.buyables[41].effect()).times(10)).plus(1))
																				player.p.geff=geff
																			if (hasChallenge("p",22)&&(!hasUpgrade("p",141)||hasUpgrade("i",12)))player.p.cmult=player.p.cmult.plus(hasUpgrade("p",141)?1:0.01)
																				if (!hasUpgrade("p",111)) player.p.cmult=player.p.cmult.min(100)
																					if (hasMilestone(this.layer,14)){
																						if (layers.p.buyables[31].canAfford())layers.p.buyables[31].buy()
																							if (layers.p.buyables[32].canAfford())layers.p.buyables[32].buy()
																								if (layers.p.buyables[33].canAfford())layers.p.buyables[33].buy()
																							}
																						if (hasMilestone(this.layer,15)){
																							if (layers.p.buyables[23].canAfford())layers.p.buyables[23].buy()
																						}
																				},
																				tabFormat: {
																					Upgrades: {
																						content:[
																						"main-display",
																						"blank",
																						["prestige-button", function(){}],
																						"blank",
																						"blank",
																						"upgrades"
																						]
																					},
																					Challenges: {
																						unlocked(){return hasUpgrade("p",51)||hasMilestone("p",0)},
																						content:[
																						"blank",
																						"blank",
																						"challenges"
																						],
																					},
																					"Buyables and Milestones": {
																						unlocked(){return hasUpgrade("p",74)||hasMilestone("p",0)},
																						content:[
																						"blank",
																						"blank",
																						["buyable",11],
																						"blank",
																						["display-text", function(){
																							if (!hasMilestone("p",0))return ""
																								return "Your boosts are making the point challenge "+getBuyableAmount("p",11).plus(1)+"x less pointy"}],
																							"blank",
																							"milestones"
																							],
																						},
																						"Generators":{
																							unlocked(){return hasMilestone("p",5)||player.i.points.gte(1)},
																							content:[
																							"blank",
																							["display-text", function(){return "You have "+format(player.p.gp)+" generator points, adding "+format(hasUpgrade("p",132)?player.p.gp.plus(1).pow(new Decimal(1).div(2)):hasUpgrade("p",101)?player.p.gp.plus(1).pow(new Decimal(1).div(3)):hasUpgrade("p",93)?player.p.gp.plus(1).pow(0.2):player.p.gp.plus(1).log10())+" to point gain."}],
																							["display-text", function(){return "You have "+format(player.p.g)+" generators, generating "+format(player.p.g.times(player.p.geff))+" generator points per second"}],
																							["display-text", function(){
																								return "Generator efficiency is "+format(player.p.geff)
																							}],
																							"blank",
																							"blank",
																							["column", [["row", [["buyable",12],["buyable",13],["buyable",14]]]]],
																							["clickable",11]
																							]
																						},
																						"Pointy points":{
																							unlocked(){return hasUpgrade("p",104)||player.i.points.gte(1)},
																							content:[
																							["display-text",
																							function() { return 'I have ' + format(player.p.buyables[21]) + ' pointy points!' },
																							{ "color": "red", "font-size": "32px", "font-family": "Comic Sans MS" }],
																							["display-text",
																							function() { return 'My pointy points are multiplying generator efficiency by '+format(new Decimal(player.p.buyables[21]).plus(1)) },
																							{ "color": "red", "font-size": "32px", "font-family": "Comic Sans MS" }],
																							"blank","blank",
																							["buyable",21],
																							["display-text",
																							function() {
																								if (!hasMilestone("i",5))return ""
																									return 'I have ' + format(player.p.buyables[22]) + ' pointy prestige points!' },
																								{ "color": "red", "font-size": "32px", "font-family": "Comic Sans MS" }],
																								["buyable",22],
																								"blank",
																								["column", [["row", [["upgrade",211],["upgrade",212],["upgrade",213],["upgrade",214],["upgrade",215]]]]],
																								["column", [["row", [["upgrade",221],["upgrade",222],["upgrade",223],["upgrade",224],["upgrade",225]]]]],
																								["display-text",
																								function() {
																									if (!hasUpgrade("p",225)&&getBuyableAmount("p",23).eq(0))return ""
																										return 'I have ' + format(player.p.buyables[23]) + ' pointy boosters!' },
																									{ "color": "red", "font-size": "32px", "font-family": "Comic Sans MS" }],
																									["buyable",23],
																									["display-text",
																									function() {if (!hasUpgrade("p",225)&&getBuyableAmount("p",23).eq(0))return ""
																									return 'My pointy boosters are raising generator efficiency to the ^'+format(new Decimal(player.p.buyables[23]).div(10).mul(new Decimal(0.1).plus(layers.p.buyables[41].effect()).times(10)).plus(1)) },
																									{ "color": "red", "font-size": "32px", "font-family": "Comic Sans MS" }],
																									"blank","blank",
																									["display-text",
																									function() {if (!hasMilestone("p",11))return ""
																									return 'Booster upgrades' },
																									{"font-size": "24px"}],
																									["column", [["row", [["upgrade",231],["upgrade",232],["upgrade",233],["upgrade",234],["upgrade",235]]]]],
																									]
																								},
																								"Buyables":{
																									unlocked(){return hasMilestone("p",13)},
																									content:["main-display",
																									["column", [["row", [["buyable",31],["buyable",32],["buyable",33]]]]],
																									["column", [["row", [["buyable",41],["buyable",42],["buyable",43]]]]],
		//["column", [["row", [["buyable",51],["buyable",52],["buyable",53]]]]],
		]
	}
}
}