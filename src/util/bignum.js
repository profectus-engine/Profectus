// This class is just used to lookup the correct bignum library set in modInfo and pass it, along with its format utility functions, through this file
// This way switching out big number libraries just needs to happen in mod.js, not every file that needs big numbers

import modInfo from '../data/mod.js';

export const {
	Decimal,
	exponentialFormat,
	commaFormat,
	regularFormat,
	format,
	formatWhole,
	formatTime,
	toPlaces,
	formatSmall,
	invertOOM
} = modInfo.bigNum;

export default Decimal;
