import Decimal from '../lib/break_eternity.js';
import modInfo from '../data/mod.js';

export default Decimal;

const decimalOne = new Decimal(1);

export function exponentialFormat(num, precision, mantissa = true) {
	let e = num.log10().floor();
	let m = num.div(Decimal.pow(10, e));
	if(m.toStringWithDecimalPlaces(precision) === 10) {
		m = decimalOne;
		e = e.add(1);
	}
	e = (e.gte(1e9) ? format(e, Math.max(Math.max(precision, 3), modInfo.defaultDecimalsShown)) : (e.gte(10000) ? commaFormat(e, 0) : e.toStringWithDecimalPlaces(0)))
	if (mantissa) {
		return m.toStringWithDecimalPlaces(precision)+"e"+e;
	} else {
		return "e"+e;
	}
}

export function commaFormat(num, precision) {
	if (num === null || num === undefined) {
		return "NaN";
	}
	if (num.mag < 0.001) {
		return (0).toFixed(precision);
	}
	let init = num.toStringWithDecimalPlaces(precision)
	let portions = init.split(".")
	portions[0] = portions[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
	if (portions.length == 1) return portions[0]
	return portions[0] + "." + portions[1]
}

export function regularFormat(num, precision) {
	if (num === null || num === undefined) {
		return "NaN";
	}
	if (num.mag < 0.0001) {
		return (0).toFixed(precision);
	}
	if (num.mag < 0.1 && precision !== 0) {
		precision = Math.max(Math.max(precision, 4), modInfo.defaultDecimalsShown);
	}
	return num.toStringWithDecimalPlaces(precision);
}

export function format(decimal, precision = null, small) {
	if (precision == null) precision = modInfo.defaultDecimalsShown;
	small = small || modInfo.allowSmall;
	decimal = new Decimal(decimal);
	if (isNaN(decimal.sign)||isNaN(decimal.layer)||isNaN(decimal.mag)) {
		//player.hasNaN = true;
		return "NaN";
	}
	if (decimal.sign<0) {
		return "-"+format(decimal.neg(), precision);
	}
	if (decimal.mag === Number.POSITIVE_INFINITY) {
		return "Infinity";
	}
	if (decimal.gte("eeee1000")) {
		const slog = decimal.slog();
		if (slog.gte(1e6)) {
			return "F" + format(slog.floor());
		} else {
			return Decimal.pow(10, slog.sub(slog.floor())).toStringWithDecimalPlaces(3) + "F" + commaFormat(slog.floor(), 0);
		}
	} else if (decimal.gte("1e100000")) {
		return exponentialFormat(decimal, 0, false);
	} else if (decimal.gte("1e1000")) {
		return exponentialFormat(decimal, 0);
	} else if (decimal.gte(1e9)) {
		return exponentialFormat(decimal, precision);
	} else if (decimal.gte(1e3)) {
		return commaFormat(decimal, 0);
	} else if (decimal.gte(0.001) || !small) {
		return regularFormat(decimal, precision);
	} else if (decimal.eq(0)) {
		return (0).toFixed(precision);
	}

	decimal = invertOOM(decimal);
	if (decimal.lt("1e1000")){
		const val = exponentialFormat(decimal, precision);
		return val.replace(/([^(?:e|F)]*)$/, '-$1');
	} else {
		return format(decimal, precision) + "⁻¹";
	}
}

export function formatWhole(decimal) {
	decimal = new Decimal(decimal);
	if (decimal.sign<0) {
		return "-"+formatWhole(decimal.neg());
	}
	if (decimal.gte(1e9)) {
		return format(decimal);
	}
	if (decimal.lte(0.98) && !decimal.eq(0)) {
		return format(decimal);
	}
	return format(decimal, 0);
}

export function formatTime(s) {
	if (s<60) {
		return format(s)+"s";
	} else if (s<3600) {
		return formatWhole(Math.floor(s/60))+"m "+format(s%60)+"s";
	} else if (s<86400) {
		return formatWhole(Math.floor(s/3600))+"h "+formatWhole(Math.floor(s/60)%60)+"m "+format(s%60)+"s";
	} else if (s<31536000) {
		return formatWhole(Math.floor(s/84600)%365)+"d " + formatWhole(Math.floor(s/3600)%24)+"h "+formatWhole(Math.floor(s/60)%60)+"m "+format(s%60)+"s";
	} else {
		return formatWhole(Math.floor(s/31536000))+"y "+formatWhole(Math.floor(s/84600)%365)+"d " + formatWhole(Math.floor(s/3600)%24)+"h "+formatWhole(Math.floor(s/60)%60)+"m "+format(s%60)+"s";
	}
}

export function toPlaces(x, precision, maxAccepted) {
	x = new Decimal(x);
	let result = x.toStringWithDecimalPlaces(precision);
	if (new Decimal(result).gte(maxAccepted)) {
		result = new Decimal(maxAccepted - Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision);
	}
	return result;
}

// Will also display very small numbers
export function formatSmall(x, precision = null) {
	return format(x, precision, true);
}

export function invertOOM(x){
	let e = x.log10().ceil();
	let m = x.div(Decimal.pow(10, e));
	e = e.neg();
	x = new Decimal(10).pow(e).times(m);

	return x;
}
