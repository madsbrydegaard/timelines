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
export class Dater implements IDater {
	constructor(input: number[] | string | number) {
		this.date = new Date();
		if(input === undefined) return;

		if(Array.isArray(input)){
			let inputArray = input as number[];
			if (inputArray.length === 0) throw new Error("argument Array cannot be empty");
			const isNumberArray =
			inputArray.every((value) => {
				return typeof value === 'number';
			});
			if (!isNumberArray) throw new Error("input Array must contain only numbers");
			this.parseArray(inputArray);
		}

		if(typeof input === "string"){
			this.parseString(input);
		}

		if(typeof input === "number"){
			this.parseMinutes(input);
		}
	}
	// Date object wrapper so not able to handle dates beyond limits of date object. Eg < -270.000 and > 270.000 years
	date!: Date;
	parseArray = (input: number[]) => {
		this.date.setFullYear(input[0] || this.date.getFullYear());
		this.date.setMonth(input[1] ? input[1] + 1 : 0);
		this.date.setDate(input[2] ? input[2] : 1);
		this.date.setHours(input[3] ? input[3] : 0);
		this.date.setMinutes(input[4] ? input[4] : 0);
	};
	parseMinutes = (minutes: number) => {
		this.date = new Date(minutes * 60000);
	};
	parseString = (input: string) => {
		switch (input) {
			case "-100y":
				this.date.setFullYear(this.date.getFullYear() - 100);
		}
	};
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