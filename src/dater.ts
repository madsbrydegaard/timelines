export interface IDater {
	date: Date;
	asArray: number[];
	inMinutes: number;
	asYMDHM: string;
	asYMD: string;
	asYM: string;
	asY: string;
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// It should be noted that the maximum Date is not of the same value as the maximum safe integer (Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991).
// Instead, it is defined in ECMA-262 that a maximum of ±100,000,000 (one hundred million) days relative
// to January 1, 1970 UTC (that is, April 20, 271821 BCE ~ September 13, 275760 CE)
// can be represented by the standard Date object (equivalent to ±8,640,000,000,000,000 milliseconds).
class Dater implements IDater {
	constructor(date?: Date) {
		this.date = date || new Date();
	}
	date!: Date;
	get asArray() {
		return [this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), this.date.getHours(), this.date.getMinutes()];
	}
	get inMinutes() {
		return Math.floor(this.date.getTime() / 60000);
	}
	get asYMDHM() {
		return Intl.DateTimeFormat(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
		}).format(this.date);
	}
	get asYMD() {
		return Intl.DateTimeFormat(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(this.date);
	}
	get asYM() {
		return Intl.DateTimeFormat(undefined, {
			year: "numeric",
			month: "short",
		}).format(this.date);
	}
	get asY() {
		// minutes in a year = 525948.766
		return this.date.getFullYear().toString();
	}
}
// Date object wrapper so not able to handle dates beyond limits of date object. Eg < -270.000 and > 270.000 years
export const dater = function (input: any): Dater {
	const fromArray = function (array: number[]) {
		const result = new Dater();
		result.date.setFullYear(array[0] || result.date.getFullYear());
		result.date.setMonth(array[1] ? array[1] + 1 : 0);
		result.date.setDate(array[2] ? array[2] : 1);
		result.date.setHours(array[3] ? array[3] : 0);
		result.date.setMinutes(array[4] ? array[4] : 0);
		return result;
	};

	const fromMinutes = function (minutes: number) {
		const result = new Dater(new Date(minutes * 60000));
		return result;
	};

	const result = new Dater();
	if (!input) return result;

	switch (typeof input) {
		case "object":
			switch (input.constructor.name) {
				case "Array":
					if (input.length === 0) throw new Error("argument Array cannot be empty");
					if (typeof input[0] !== "number") throw new Error("argument Array must contain only numbers");
					return fromArray(input);
				default:
					return result;
			}
		case "number": {
			// assume minutes as input
			return fromMinutes(input);
		}
		case "string":
			switch (input) {
				case "now":
					return result;
				case "-100y":
					result.date.setFullYear(result.date.getFullYear() - 100);
					return result;
				default:
					if (isNaN(Number(input))) {
						throw new Error("Argument not supported `" + input + "`");
					} else {
						return result;
					}
			}
		default:
			return result;
	}
};
