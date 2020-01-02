/**
 * Implementation of the Either monad
 */
class Either {
	constructor(left, right) {
		if (left && right) {
			throw new Error("Cannot set both the left and right branches of an Either");
		}
		if (!(left || right)) {
			throw new Error("Must set at least one of the left or right branches of an Either.");
		}
		this.left = left;
		this.right = right;
	}

	static left(value) {
		return new Either(value, undefined);
	}

	static right(value) {
		return new Either(undefined, value);
	}
}
/**
 * Implementation of the C language.
 */
const 𝙲 = (() => {
	'use strict';
	let myExport = {};
	const latin = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	myExport.latin = latin;
	const math  = ['\u00A0', '𝙰','𝙱','𝙲','𝙳','𝙴','𝙵','𝙶','𝙷','𝙸','𝙹','𝙺','𝙻','𝙼','𝙽',
	'𝙾','𝙿','𝚀','𝚁','𝚂','𝚃','𝚄','𝚅','𝚆','𝚇','𝚈','𝚉','𝚊','𝚋','𝚌','𝚍','𝚎','𝚏',
	'𝚐','𝚑','𝚒','𝚓','𝚔','𝚕','𝚖','𝚗','𝚘','𝚙','𝚚','𝚛','𝚜','𝚝','𝚞','𝚟','𝚠','𝚡',
	'𝚢','𝚣','𝟶','𝟷','𝟸','𝟹','𝟺','𝟻','𝟼','𝟽','𝟾','𝟿'];

	// Operators
	const operators = {
		'bak': {
			'opcode': 0,
		},
		'for': {
			'opcode': 1,
		},
		'inc': {
			'opcode': 2,
		},
		'dec': {
			'opcode': 3,
		},
		'inp': {
			'opcode': 4,
		},
		'out': {
			'opcode': 5,
		},
		'jez': {
			'opcode': 6,
		},
		'jnz': {
			'opcode': 7,
		},
	};
	let opcodeToOperator = [];
	for (let key in operators) {
		opcodeToOperator[operators[key]['opcode']] = key;
	}
	Object.freeze(opcodeToOperator);
	let opcodeTo3Bits = [];
	for (let key in opcodeToOperator) {
		let binary = Number(key)
			.toString(2)
			.padStart(3, '0')
			.split('')
			.map(b => b == '1');
		opcodeTo3Bits[key] = binary;
	}
	Object.freeze(opcodeTo3Bits);

	/**
	 * @param assembly [String] the assembly code, using the 8 operators
	 * mentioned above.
	 * @return [Either<String,Array<Int>>] the operators translated to their
	 * opcodes, or a String explaining what went wrong.
	 */
	function toOpcode(assembly) {
		const assemblyWithoutComments = assembly.replace(/#[^\n]*/g, '');
		const assemblyAsTokens = assemblyWithoutComments.split(/[^a-z]+/).filter(t => t.length > 0);
		let opCodes = [];
		for (const token of assemblyAsTokens) {
			const op = operators[token];
			if (op) {
				opCodes.push(op.opcode);
			} else {
				return Either.left(`Unknown token "${token}". Valid tokens are: ${Object.keys(operators)}.`);
			}
		}
		return Either.right(opCodes);
	}
	myExport.toOpcode = toOpcode;

	/**
	 * @param opCodes [Array<Int>] a sequence of opcodes, one per instruction.
	 * @param medium [String] the medium into which we the program text should be embedded.
	 * @return [Either<String, String>] the resulting 𝙲 program, or an error message.
	 */
	function embed(opCodes, medium) {
		let source = '';
		let i = 0;
		for (let opCode of opCodes) {
			for (let bit of opcodeTo3Bits[opCode]) {
				let charsetToWrite = bit ? math : latin;
				let bitEncoded = false;
				do {
					if (i >= medium.length) {
						return Either.left(`Medium isn't big enough. Needs to contain at least ${opCodes.length * 3} alphanumeric characters.`)
					}
					let latinIndex = latin.indexOf(medium[i]);
					if (latinIndex === -1) {
						let mathIndex = math.indexOf(medium[i]);
						if (mathIndex === -1) {
							source += medium[i]; //Can't use character, try next one.
						} else {
							source += charsetToWrite[latinIndex];
							bitEncoded = true;
						}
					} else {
						source += charsetToWrite[latinIndex];
						bitEncoded = true;
					}
					i++;
				} while(!bitEncoded);
			}
		}
		source += medium.substr(i)
		return Either.right(source);
	}
	myExport.embed = embed;

	function chunkArray(array, chunkSize) {
		const retVal = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			retVal.push(array.slice(i, i + chunkSize));
		}
		return retVal;
	}

	/**
	 * @param source [String] the source code to a 𝙲 program.
	 * @return [Array<Int>] an array of opcodes as represented by this program.
	 */
	function getOpCodes(source) {
		let bits = [];
		for (const c of source) {
			if (latin.indexOf(c) !== -1) {
				bits.push(0);
			} else if (math.indexOf(c) !== -1) {
				bits.push(1);
			} //else do nothing
		}
		return chunkArray(bits, 3).map((word) => parseInt(word.join(''), 2));
	}

	class Instruction {
		constructor(opCode, children) {
			this.opCode = opCode;
			this.children = children;
		}
	}

	/**
	 * @param opCodes [Array<Int>] an array of opcodes
	 * @return Array[Instruction] an array of instructions
	 */
	function parse(opCodes) {
		let i = 0;
		let retVal = [];
		while (i < opCodes.length) {
			let opCode = opCodes[i];
			if (opcodeToOperator[opCode] === 'jez') {
				let subparse = parse(opCodes.slice(i + 1));
				retVal.push(new Instruction('loop', subparse.parsed));
				i += (subparse.numParsed + 1);
			} else if (opcodeToOperator[opCode] === 'jnz') {
				break;
			} else {
				retVal.push(new Instruction(opcodeToOperator[opCode], undefined));
			}
			i++;
		}
		return {
			parsed: retVal,
			numParsed: i
		};
	}

	class Interpreter {
		constructor(source) {
			const opCodes = getOpCodes(source);
			this.root = parse(opCodes).parsed;
			this.environment = [0];
			this.callstack = [];
			this.dp = 0;
			this.running = false;
			this.output = [];
		}

		execute(fnGetInput, fnOnDone) {
			if (this.running) {
				throw new Error("Interpreter is already running.");
			}
			this.environment = [0];
			this.callstack = [];
			this.dp = 0;
			this.output = [];
			this.running = true;
			this.callstack.push({
				scope: this.root,
				ip: 0
			});
			const step = () => {
				window.setTimeout(_step);
			}
			const _step = () => {
				if (this.running !== true) {
					console.log(this);
					throw "Weird state; not running";
				}
				const frame = this.callstack.pop();
				if (frame.scope.length <= frame.ip) {
					//We just finished executing a frame, check if there's a caller to return to.
					if (this.callstack.length === 0) {
						console.log("Done executing program.");
						this.running = false;
						return fnOnDone();
					} else {
						if (this.callstack[this.callstack.length - 1].scope[this.callstack[this.callstack.length - 1].ip].opCode !== 'loop') {
							console.log(this.callstack);
							throw "Weird state";
						}
						return step();
					}
				}
				const instruction = frame.scope[frame.ip];
				console.log("Stepping", instruction, this.environment, this.dp, this);
				//debugger;
				switch (instruction.opCode) {
					case 'for':
						this.dp += 1;
						if (this.environment.length == this.dp) {
							this.environment.push(0);
						}
						this.callstack.push({
							scope: frame.scope,
							ip: frame.ip + 1
						});
						return step();
					case 'bak':
						this.dp -= 1;
						if (this.dp < 0) {
							this.dp = 0;
							//console.log("Warning: Tried to move too far to the left.");
						}
						this.callstack.push({
							scope: frame.scope,
							ip: frame.ip + 1
						});
						return step();
					case 'inc':
						this.environment[this.dp] += 1;
						this.callstack.push({
							scope: frame.scope,
							ip: frame.ip + 1
						});
						return step();
					case 'dec':
						this.environment[this.dp] -= 1;
						this.callstack.push({
							scope: frame.scope,
							ip: frame.ip + 1
						});
						return step();
					case 'inp':
						fnGetInput((char) => {
							this.environment[this.dp] = char;
							this.callstack.push({
								scope: frame.scope,
								ip: frame.ip + 1
							});
							return step();
						});
						return; 
					case 'out':
						this.output.push(String.fromCharCode(this.environment[this.dp]));
						this.callstack.push({
							scope: frame.scope,
							ip: frame.ip + 1
						});
						return step();
					case 'loop':
						if (this.environment[this.dp] === 0) {
							this.callstack.push({
								scope: frame.scope,
								ip: frame.ip + 1
							});
							return step();
						} else {
							this.callstack.push(frame);
							this.callstack.push({
								scope: instruction.children,
								ip: 0
							});
							return step();
						}
						break;
					default:
						console.log("Unknown instruction", instruction, "Terminating program.");
						this.running = false;
						return fnOnDone();
				}
			};
			step();
		}
	}
	myExport.Interpreter = Interpreter;
	return myExport;
})();