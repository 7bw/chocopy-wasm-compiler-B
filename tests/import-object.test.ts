import { readFileSync } from "fs";
import { BinOp } from '../ast';
import { BuiltinLib} from "../builtinlib";
//import { importObject } from "../debugger/tests/import-object.test";
import * as RUNTIME_ERROR from '../runtime_error'
import { gcd_help, generateRandomBigInt, perm_help } from '../builtinlib';
import { RunTimeError } from '../error_reporting';


enum Type { Num, Bool, None }

function stringify(typ: Type, arg: any): string {
  switch (typ) {
    case Type.Num:
      return (arg as number).toString();
    case Type.Bool:
      return (arg as boolean) ? "True" : "False";
    case Type.None:
      return "None";
  }
}

function reconstructBigint(arg : number, load : any) : bigint {
  var base = BigInt(2 ** 31);
  var digitNum = load(arg, 0);

  var isNegative = BigInt(1);
  if (digitNum < 0) {
    isNegative = BigInt(-1);
    digitNum *= -1;
  }

  var constructedBigint = BigInt(0);
  for (let i = 1; i < digitNum + 1; i++) {
    constructedBigint += BigInt(load(arg, i)) * (base ** BigInt(i - 1));
  }
  return isNegative * constructedBigint;
}

function deconstructBigint(bigInt : bigint, alloc : any, store : any) : number {
  var isNegative = 1;
  if (bigInt < 0) {
    isNegative = -1;
    bigInt *= BigInt(-1);
  }

  var i = 1; // the first field is preserved for the size
  const base = BigInt(2 ** 31);
  var curAddress = alloc(0);

  // use a do-while loop to address the edge case of initial curVal == 0
  do {
    var remainder = bigInt % base;
    store(curAddress, i, Number(remainder)); // call the store function with address, offset, and val

    i += 1; // next iteration
    bigInt /= base; // default to use floor() 
  } while (bigInt > 0);

  alloc(i); // alllocate spaces for the fields
  store(curAddress, 0, isNegative * (i - 1)); // store the number of digits in the first field
  return curAddress;
}

function arithmeticOp(op : any, arg1 : number, arg2 : number, alloc : any, load : any, store : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  var bigInt3 = BigInt(0);

  switch (op) {
    case BinOp.Plus:
      bigInt3 = bigInt1 + bigInt2;
      break
    case BinOp.Minus:
      bigInt3 = bigInt1 - bigInt2;
      break
    case BinOp.Mul:
      bigInt3 = bigInt1 * bigInt2;
      break
    case BinOp.IDiv:
      bigInt3 = bigInt1 / bigInt2;
      break
    case BinOp.Mod: 
      bigInt3 = bigInt1 % bigInt2;
      break
  }
  return deconstructBigint(bigInt3, alloc, store);
}

function comparisonOp(op : any, arg1 : number, arg2 : number, alloc : any, load : any, store : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  switch (op) {
    case BinOp.Eq:
      case BinOp.Eq:
        return bigInt1 === bigInt2;
      case BinOp.Neq:
        return bigInt1 !== bigInt2;
      case BinOp.Lte:
        return bigInt1 <= bigInt2;
      case BinOp.Gte:
        return bigInt1 >= bigInt2;
      case BinOp.Lt: 
        return bigInt1 < bigInt2;
      case BinOp.Gt: 
        return bigInt1 > bigInt2;
    }
    throw Error("RUNTIME ERROR: Unknown bigint comparison operator");
}

function print(typ: Type, arg : number, load : any) : any {
  if (typ === Type.Num) {
    importObject.output += reconstructBigint(arg, load).toString() + "\n";
  } else {
    importObject.output += stringify(typ, arg) + "\n";
  }
  return arg;
}

function print_helper(typ: Type, arg: any): any {
  importObject.output += stringify(typ, arg);
  importObject.output += "\n";
  return arg;
}

function last_print(typ: Type, arg : number, load : any) : any {
  return arg;
}

// printing within sets
function set_print(type: Type, arg: number) : any {
  return arg; 
}

function index_out_of_bounds(length: any, index: any): any {
  if (index < 0 || index >= length)
    throw new Error(`RUNTIME ERROR: Index ${index} out of bounds`);
  return index;
}

// Builtin starts
function abs_big(arg : number, alloc : any, load : any, store : any) : any {
  var bigInt = reconstructBigint(arg, load);
  if (bigInt >= BigInt(0)) {
    return arg;
  }
  return deconstructBigint(-bigInt, alloc, store);
}

function min_big(arg1 : number, arg2 : number, load : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  if (bigInt1 > bigInt2) {
    return arg2;
  }
  return arg1;
}

function max_big(arg1 : number, arg2 : number, load : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  if (bigInt1 > bigInt2) {
    return arg1;
  }
  return arg2;
}

function pow_big(arg1 : number, arg2 : number, alloc : any, load : any, store : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);

  // "**"" returns the result of raising the first operand to the power of the second operand. 
  // It is equivalent to Math. pow , except it also accepts BigInts as operands.
  var bigInt3 = bigInt1 ** bigInt2;
  return deconstructBigint(bigInt3, alloc, store);
}

function factorial(x:number, load: any, alloc: any, store: any) {
  var bigInt = reconstructBigint(x,load); 
  var ans = factorial_help(bigInt)
  return deconstructBigint(ans,alloc,store)
}
 
function factorial_help(x:bigint):bigint{
  return x>0 ? x*factorial_help(x-BigInt(1)): BigInt(1)
}

function randint(x:number, y:number, load: any, alloc: any, store: any):number{
  var lowInt = reconstructBigint(x,load);
  var highInt = reconstructBigint(y,load); 
  if(highInt<lowInt) 
    throw new RunTimeError("randint range error, upperBound less than lowerBound");
  var ans = generateRandomBigInt(lowInt, highInt); 
  return deconstructBigint(ans, alloc,store); 
}

function gcd(arg1:number,arg2:number, load: any, alloc: any, store: any):number{
  var a = reconstructBigint(arg1, load); 
  var b = reconstructBigint(arg2, load); 
  if (a<BigInt(0) || b<BigInt(0) || a==BigInt(0) && b==BigInt(0))
    throw new RunTimeError("gcd param error, eq or less than 0");
  var ans = gcd_help(b,a %b);
  return deconstructBigint(ans, alloc, store);
}

function lcm(arg1:number, arg2:number, load: any, alloc: any, store: any):number{
  var x = reconstructBigint(arg1, load); 
  var y = reconstructBigint(arg2, load); 
  if (x<=BigInt(0) || y<=BigInt(0) || x==BigInt(0) && y==BigInt(0))
    throw new RunTimeError("lcm param negative error, eq or less than 0");
  var ans = x*y/gcd_help(x,y)
  return deconstructBigint(ans, alloc, store);
}

function comb(arg1:number, arg2:number, load: any, alloc: any, store: any):number{
  var x = reconstructBigint(arg1, load); 
  var y = reconstructBigint(arg2, load); 
  if (x < y || x < 0 || y < 0)
    throw new RunTimeError("comb param error");
  var ans = perm_help(x,y) / perm_help(y,y); 
  return deconstructBigint(ans, alloc, store);
}

function perm(arg1:number, arg2:number,load: any, alloc: any, store: any):number{
  var x = reconstructBigint(arg1, load); 
  var y = reconstructBigint(arg2, load); 
  if (x < y || x < 0 || y < 0)
    throw new RunTimeError("perm param error");
  var ans = perm_help(x,y); 
  return deconstructBigint(ans, alloc, store);
}

function randrange(arg1:number, arg2:number, step:number,load: any, alloc: any, store: any):number{
  var x = reconstructBigint(arg1, load); 
  var y = reconstructBigint(arg2, load); 
  var step2 = reconstructBigint(step, load); 
  if(y<x) 
    throw new RunTimeError("randrange range error, upperBound less than lowerBound");
  let result = generateRandomBigInt(x, y)
  while ((result - x) % step2 !== BigInt(0)) {
    result = generateRandomBigInt(x, y)
  }
  return deconstructBigint(result, alloc, store); 
}

function sleep(ms:number, load: any):number{
  var x = reconstructBigint(ms, load);  
	const start = Date.now();
	while (Date.now()-start<x);
	return 0;
}

function time(alloc: any, store: any): number {
  var ans = BigInt(Date.now()%1000000000)
  return deconstructBigint(ans, alloc, store); 
}

// convert numbers to bool 
function bool(arg1: number,load: any): boolean {
  var x = reconstructBigint(arg1, load); 
  var ans = true
  if (x === BigInt(0)) {
    ans = false
  }
  return ans
}

// convert bools to numbers
function int(arg1: any, load: any, alloc: any, store: any): any {
  if (arg1 === 1) 
    return deconstructBigint(BigInt(1), alloc, store); 
  
  return deconstructBigint(BigInt(0), alloc, store);
}
// Builtins End

// This function is proposed by the string group.
function big_to_i32(arg : number, load : any) : any {
  var bigInt = reconstructBigint(arg, load);
  const min_value = -2147483648;
  const max_value = 2147483647;

  if (bigInt > BigInt(max_value) || bigInt < BigInt(min_value)) {
    throw Error("RUNTIME ERROR: Cannot convert bigint to i32");
  } else {
    return Number(bigInt);
  }
}
/*
function assert_not_none(arg: any) : any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
} 
*/ 

export function division_by_zero(arg: number, line: number, col: number, load: any) : any {
  var bigInt = reconstructBigint(arg, load);

  if (bigInt === BigInt(0)) {
    var message = RUNTIME_ERROR.stackTrace() + "\nRUNTIME ERROR: division by zero in line " + line.toString() + " at column " + col.toString() + "\n" + RUNTIME_ERROR.splitString()[line-1].trim();
    throw new RunTimeError(message);
  }
  return arg;
}

export async function addLibs() {
  const memory = new WebAssembly.Memory({initial:10, maximum:100});
  const bytes = readFileSync("build/memory.wasm");
  
  const memoryModule = await WebAssembly.instantiate(bytes, { js: { mem: memory } })
  importObject.libmemory = memoryModule.instance.exports;
  
  
  importObject.memory_values = memory;
  importObject.js = {memory};

  var alloc = importObject.libmemory.alloc;
  var load = importObject.libmemory.load;
  var store = importObject.libmemory.store;
  
  // print functions
  importObject.print = (arg: any) => print(Type.Num, arg, load);
  importObject.print_helper = (arg:any) => print_helper(Type.Num, arg);
  importObject.imports.print_num = (arg: number) => print(Type.Num, arg, load);
  importObject.imports.print_set_num = (arg: number) => print(Type.Num, arg, load);
  importObject.imports.print_last_num = (arg: number) => last_print(Type.Num, arg, load);
  importObject.imports.print_bool = (arg: number) => print(Type.Bool, arg, load);
  importObject.imports.print_none = (arg: number) => print(Type.None, arg, load);

  // arithmetic operators
  importObject.imports.plus = (arg1: number, arg2: number) => arithmeticOp(BinOp.Plus, arg1, arg2, alloc, load, store);
  importObject.imports.minus = (arg1: number, arg2: number) => arithmeticOp(BinOp.Minus, arg1, arg2, alloc, load, store);
  importObject.imports.mul = (arg1: number, arg2: number) => arithmeticOp(BinOp.Mul, arg1, arg2, alloc, load, store);
  importObject.imports.iDiv = (arg1: number, arg2: number) => arithmeticOp(BinOp.IDiv, arg1, arg2, alloc, load, store);
  importObject.imports.mod = (arg1: number, arg2: number) => arithmeticOp(BinOp.Mod, arg1, arg2, alloc, load, store);

  // comparison operators
  importObject.imports.eq = (arg1: number, arg2: number) => comparisonOp(BinOp.Eq,arg1, arg2, alloc, load, store);
  importObject.imports.neq = (arg1: number, arg2: number) => comparisonOp(BinOp.Neq,arg1, arg2, alloc, load, store); 
  importObject.imports.lte = (arg1: number, arg2: number) => comparisonOp(BinOp.Lte,arg1, arg2, alloc, load, store); 
  importObject.imports.gte = (arg1: number, arg2: number) => comparisonOp(BinOp.Gte,arg1, arg2, alloc, load, store); 
  importObject.imports.lt = (arg1: number, arg2: number) => comparisonOp(BinOp.Lt,arg1, arg2, alloc, load, store);
  importObject.imports.gt = (arg1: number, arg2: number) => comparisonOp(BinOp.Gt,arg1, arg2, alloc, load, store); 

  // builtin functions
  importObject.imports.abs = (arg: number) => abs_big(arg, alloc, load, store);
  importObject.imports.min = (arg1: number, arg2: number) => min_big(arg1, arg2, load);
  importObject.imports.max = (arg1: number, arg2: number) => max_big(arg1, arg2, load);
  importObject.imports.pow = (arg1: number, arg2 : number) => pow_big(arg1, arg2, alloc, load, store);
  importObject.imports.factorial = (arg1: number) => factorial(arg1,load,alloc,store);
  importObject.imports.randint = (arg1: number, arg2: number) => randint(arg1, arg2, load, alloc, store);
  importObject.imports.gcd = (arg1: number, arg2: number) => gcd(arg1, arg2, load, alloc, store);
  importObject.imports.lcm = (arg1: number, arg2: number) => lcm(arg1, arg2, load, alloc, store);
  importObject.imports.perm = (arg1: number, arg2: number) => perm(arg1, arg2, load, alloc, store);
  importObject.imports.comb = (arg1: number, arg2: number) => comb(arg1, arg2, load, alloc, store);
  importObject.imports.randrange = (arg1: number, arg2: number, step: number) => randrange(arg1, arg2, step, load, alloc, store);
  importObject.imports.sleep = (arg1: number) => sleep(arg1, load);
  importObject.imports.time = () => time(alloc, store);
  importObject.imports.bool = (arg1: number) => bool(arg1,load);
  importObject.imports.int = (arg1: any) => int(arg1,load, alloc, store);

  // for string/list/set group
  importObject.imports.get_num = (arg: number) => big_to_i32(arg, load);

  // others
  importObject.imports.index_out_of_bounds = (length: any, index: any) => index_out_of_bounds(length, index);
  importObject.imports.division_by_zero = (arg: number, line: number, col: number) => division_by_zero(arg, line, col, load);
  importObject.imports.assert_not_none = (arg: any, line: number, col: number) => RUNTIME_ERROR.assert_not_none(arg, line, col);
  importObject.imports.stack_push = (line: number) => RUNTIME_ERROR.stack_push(line);
  importObject.imports.stack_clear = () => RUNTIME_ERROR.stack_clear();

  const setBytes = readFileSync("build/sets.wasm");
  const setModule = await WebAssembly.instantiate(setBytes, {...importObject, js: { mem: memory } })
  importObject.libset = setModule.instance.exports;
  
  return importObject;
}

export const importObject : any = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    index_out_of_bounds: (length: any, index: any) => index_out_of_bounds(length, index),
    //division_by_zero: (arg: number, line: number, col: number) => RUNTIME_ERROR.division_by_zero(arg, line, col),
    key_not_found: (arg: number, line: number, col: number) => RUNTIME_ERROR.key_not_found(arg),
    assert_not_none: (arg: any, line: number, col: number) => RUNTIME_ERROR.assert_not_none(arg, line, col),
    stack_push: (line: number) => RUNTIME_ERROR.stack_push(line),
    stack_clear: () => RUNTIME_ERROR.stack_clear(),
    /*
    print: (arg: any) => print(Type.Num, arg,),
    print_num: (arg: number) => print(Type.Num, arg),
    print_bool: (arg: number) => print(Type.Bool, arg),
    print_none: (arg: number) => print(Type.None, arg),
    */

   // added so $print_num in sets won't crash testing due to an import in sets.wat 
    //print_set_num: (arg: number) => print(Type.Num, arg, load),
    ...BuiltinLib.reduce((o:Record<string, Function>, key)=>Object.assign(o, {[key.name]:key.body}), {}),
  },
  output: "",
};
