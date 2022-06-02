import { BasicREPL} from './repl';
import { Type, Value, BinOp } from './ast';
import { defaultTypeEnv } from './type-check';
import { NUM, BOOL, NONE } from './utils';
import * as RUNTIME_ERROR from './runtime_error'
import { renderResult, renderError, renderPrint, renderPrintHelper } from "./outputrender";
import { log, table } from 'console';
import { runtime, sources } from 'webpack';
import { gcd_help, generateRandomBigInt, perm_help } from './builtinlib';
import {BuiltinLib} from "./builtinlib"
import { RunTimeError } from './error_reporting';

import CodeMirror from "codemirror";
import "codemirror/addon/edit/closebrackets";
import "codemirror/mode/python/python";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/comment-fold";
import "./style.scss";


function stringify(typ: Type, arg: any) : string {
  switch(typ.tag) {
    case "number":
      return (arg as number).toString();
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

export function reconstructBigint(arg : number, load : any) : bigint {
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

// allocate the bigint
export function deconstructBigint(bigInt : bigint, alloc : any, store : any) : number {
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
      break;
    case BinOp.Minus:
      bigInt3 = bigInt1 - bigInt2;
      break;
    case BinOp.Mul:
      bigInt3 = bigInt1 * bigInt2;
      break;
    case BinOp.IDiv:
      bigInt3 = bigInt1 / bigInt2;
      break;
    case BinOp.Mod: 
      bigInt3 = bigInt1 % bigInt2;
      break;
  }
  return deconstructBigint(bigInt3, alloc, store);
}

function comparisonOp(op : any, arg1 : number, arg2 : number, alloc : any, load : any, store : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  switch (op) {
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

// replaced with print in "outputrender"
function print(typ : Type, arg : number, load : any) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  //elt.innerText = stringify(typ, arg);

  if (typ.tag === "number") {
    elt.innerText = reconstructBigint(arg, load).toString();
  }
  return arg;
}

// Builtins start, moved from builtinlib to webstart to avoid ReferenceError
export function abs_big(arg : number, alloc : any, load : any, store : any) : any {
  var bigInt = reconstructBigint(arg, load);
  if (bigInt >= BigInt(0)) {
    return arg;
  }
  return deconstructBigint(-bigInt, alloc, store);
}

export function min_big(arg1 : number, arg2 : number, load : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  if (bigInt1 > bigInt2) {
    return arg2;
  }
  return arg1;
}

export function max_big(arg1 : number, arg2 : number, load : any) : any {
  var bigInt1 = reconstructBigint(arg1, load);
  var bigInt2 = reconstructBigint(arg2, load);
  if (bigInt1 > bigInt2) {
    return arg1;
  }
  return arg2;
}

export function pow_big(arg1 : number, arg2 : number, alloc : any, load : any, store : any) : any {
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
export function big_to_i32(arg : number, load : any) : any {
  var bigInt = reconstructBigint(arg, load);
  const min_value = -2147483648;
  const max_value = 2147483647;

  if (bigInt > BigInt(max_value) || bigInt < BigInt(min_value)) {
    throw Error("RUNTIME ERROR: Cannot convert bigint to i32");
  } else {
    return Number(bigInt);
  }
}

function assert_not_none(arg: any) : any {
  if (arg === 0)
    throw new Error("RUNTIME ERROR: cannot perform operation on none");
  return arg;
} 

export function division_by_zero(arg: number, line: number, col: number, load: any) : any {
  var bigInt = reconstructBigint(arg, load);

  if (bigInt === BigInt(0)) {
    var message = RUNTIME_ERROR.stackTrace() + "\nRUNTIME ERROR: division by zero in line " + line.toString() + " at column " + col.toString() + "\n" + RUNTIME_ERROR.splitString()[line-1].trim();
    throw new RunTimeError(message);
  }
  return arg;
}

function index_out_of_bounds(length: any, index: any): any {
  if (index < 0 || index >= length)
    throw new Error(`RUNTIME ERROR: Index ${index} out of bounds`);
  return index;
}

function webStart() {
  var filecontent: string | ArrayBuffer;
  document.addEventListener("DOMContentLoaded", async function() {

    // https://github.com/mdn/webassembly-examples/issues/5
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
    const memoryModule = await fetch('memory.wasm').then(response =>
      response.arrayBuffer()
    ).then(bytes =>
      WebAssembly.instantiate(bytes, { js: { mem: memory } })
    );

    var alloc = memoryModule.instance.exports.alloc;
    var load = memoryModule.instance.exports.load;
    var store = memoryModule.instance.exports.store;

    var importObject:any = {
      imports: {
        ...BuiltinLib.reduce((o:Record<string, Function>, key)=>Object.assign(o, {[key.name]:key.body}), {}),
        index_out_of_bounds: (length: any, index: any) => index_out_of_bounds(length, index),
        //division_by_zero: (arg: number, line: number, col: number) => RUNTIME_ERROR.division_by_zero(arg, line, col),
        key_not_found: (arg: number, line: number, col: number) => RUNTIME_ERROR.key_not_found(arg), 
        stack_push: (line: number) => RUNTIME_ERROR.stack_push(line),
        stack_clear: () => RUNTIME_ERROR.stack_clear(),
        assert_not_none: (arg: any, line: number, col: number) => RUNTIME_ERROR.assert_not_none(arg, line, col),
        print_num: (arg: number) => renderPrint(NUM, arg, load),
        print_set_num:(arg: number) => renderPrintHelper(NUM, arg), 
        print_last_num: (arg: number) => renderPrint(NUM, arg, load),
        print_bool: (arg: number) => renderPrint(BOOL, arg, load),
        print_none: (arg: number) => renderPrint(NONE, arg, load),
        plus: (arg1: number, arg2: number) => arithmeticOp(BinOp.Plus, arg1, arg2, alloc, load, store),
        minus: (arg1: number, arg2: number) => arithmeticOp(BinOp.Minus, arg1, arg2, alloc, load, store),
        mul: (arg1: number, arg2: number) => arithmeticOp(BinOp.Mul, arg1, arg2, alloc, load, store),
        iDiv: (arg1: number, arg2: number) => arithmeticOp(BinOp.IDiv, arg1, arg2, alloc, load, store),
        mod: (arg1: number, arg2: number) => arithmeticOp(BinOp.Mod, arg1, arg2, alloc, load, store),
        eq: (arg1: number, arg2: number) => comparisonOp(BinOp.Eq,arg1, arg2, alloc, load, store), 
        neq: (arg1: number, arg2: number) => comparisonOp(BinOp.Neq,arg1, arg2, alloc, load, store), 
        lte: (arg1: number, arg2: number) => comparisonOp(BinOp.Lte,arg1, arg2, alloc, load, store), 
        gte: (arg1: number, arg2: number) => comparisonOp(BinOp.Gte,arg1, arg2, alloc, load, store), 
        lt: (arg1: number, arg2: number) => comparisonOp(BinOp.Lt,arg1, arg2, alloc, load, store),
        gt: (arg1: number, arg2: number) => comparisonOp(BinOp.Gt,arg1, arg2, alloc, load, store), 
        abs: (arg: number) => abs_big(arg, alloc, load, store),
        min: (arg1: number, arg2: number) => min_big(arg1, arg2, load),
        max: (arg1: number, arg2: number) => max_big(arg1, arg2, load),
        pow: (arg1: number, arg2 : number) => pow_big(arg1, arg2, alloc, load, store),
        factorial: (arg1: number) => factorial(arg1,load,alloc,store),
        randint: (arg1: number, arg2: number) => randint(arg1, arg2, load, alloc, store),
        gcd: (arg1: number, arg2: number) => gcd(arg1, arg2, load, alloc, store),
        lcm: (arg1: number, arg2: number) => lcm(arg1, arg2, load, alloc, store),
        perm: (arg1: number, arg2: number) => perm(arg1, arg2, load, alloc, store),
        comb: (arg1: number, arg2: number) => comb(arg1, arg2, load, alloc, store),
        randrange: (arg1: number, arg2: number, step: number) => randrange(arg1, arg2, step, load, alloc, store),
        sleep: (arg1: number) => sleep(arg1, load),
        time: () => time(alloc, store), 
        bool: (arg1: number) => bool(arg1,load),
        int: (arg1: any) => int(arg1,load, alloc, store),
        get_num: (arg: number) => big_to_i32(arg, load)
      },
      libmemory: memoryModule.instance.exports,
      memory_values: memory, //it is kind of pointer pointing to heap
      js: {memory: memory}
    };

    const setModule = await fetch('sets.wasm').then(response =>
      response.arrayBuffer()
    ).then(bytes =>
      WebAssembly.instantiate(bytes, {...importObject, js: { mem: memory } })
    );

    importObject.libset = setModule.instance.exports;
    
    var repl = new BasicREPL(importObject);

    function setupRepl() {
      document.getElementById("output").innerHTML = "";
      const replCodeElement = document.getElementById("next-code") as HTMLTextAreaElement;
      replCodeElement.addEventListener("keypress", (e) => {
    
        if (e.shiftKey && e.key === "Enter") {
        } else if (e.key === "Enter") {
          e.preventDefault();
          const source = replCodeElement.value;
    
          const output = document.createElement("div");
          const prompt = document.createElement("span");
          prompt.innerText = "» " + source;
          output.appendChild(prompt);
          // const elt = document.createElement("textarea");
          // // elt.type = "text";
          // elt.disabled = true;
          // elt.className = "repl-code";
          // output.appendChild(elt);
          document.getElementById("output").appendChild(output);
          
          // elt.value = source;
          replCodeElement.value = "";
    
          if(source === ""){
            return false;
          }
          repl.run(source).then((r) => {
            // console.log(r);
            var objectTrackList = repl.trackObject(r, repl.trackHeap());
            renderResult(r, objectTrackList);
            console.log("run finished");
          })
            .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }
    
    setupRepl();

    function resetRepl() {
      document.getElementById("output").innerHTML = "";
    }

    document.getElementById("clear").addEventListener("click", (e)=>{
      resetRepl();
      //resets environment
      repl = new BasicREPL(importObject);
      //clear editor
      var element = document.getElementById("user-code") as HTMLTextAreaElement;
      element.value = "";
    })

    document.getElementById("run").addEventListener("click", function (e) {
      repl = new BasicREPL(importObject);
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      resetRepl();
      repl.run(source.value).then((r) => {
        var objectTrackList = repl.trackObject(r, repl.trackHeap());
        renderResult(r, objectTrackList);
        console.log("run finished")

      })
        .catch((e) => { renderError(e); console.log("run failed", e) });;
    });

    document.getElementById("choose_file").addEventListener("change", function (e) {
      //load file
      var input: any = e.target;
      var reader = new FileReader();
      reader.onload = function () {
        filecontent = reader.result;
        resetRepl();
        //reset environment
        repl = new BasicREPL(importObject);
        // Repalce text area with the content in the uploaded file
        editor.setValue(filecontent.toString());
      };
      reader.readAsText(input.files[0]);
    });

    document.getElementById("import").addEventListener("click", function () {
      document.getElementById("choose_file").click();
    });

    document.getElementById("save").addEventListener("click", function (e) {
      //download the code in the user-code text area
      var FileSaver = require("file-saver");
      var title = "download";
      const source = editor.getValue();
      var blob = new Blob([source], { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(blob, title);
    });

    const textarea = document.getElementById("user-code") as HTMLTextAreaElement;
    const editor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: "blackboard",
      lineNumbers: true,
      autoCloseBrackets: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      extraKeys: {
        "Ctrl": "autocomplete",
      },
      // scrollbarStyle: "simple",
    } as any);
    console.log('thy this is not run textarea', textarea)
    console.log(editor)
    
    editor.on("change", (cm, change) => {

        textarea.value = editor.getValue();
    })
    editor.on('inputRead', function onChange(editor, input) {
        if (input.text[0] === ';' || input.text[0] === ' ' || input.text[0] === ":") {
            return;
        }
        (editor as any).showHint({
        });
    });

    dragbarFunction();
    promptTextArea();

  });

}

function dragbarFunction(){
  var bar = document.getElementById("dragbar") as HTMLElement;
  console.log(bar);
  var wrapper = bar.closest('.dynamic-content-border') as HTMLElement;
  var codeEditor = wrapper.querySelector('.absolute-content-border') as HTMLElement;
  var interactions = wrapper.querySelector('.interection-content-border') as HTMLElement;
  var isDragging = false;

  document.addEventListener('mousedown', function(e){
    if(e.target === bar){
      isDragging = true;
    }
  });

  document.addEventListener('mousemove', function(e){
    if(!isDragging){
      return false;
    }

    var containerOffsetLeft = wrapper.offsetLeft;
    var pointerRelativeXpos = e.clientX - containerOffsetLeft;
    var editorMinWidth = 60;
    var editorWidth = (Math.max(editorMinWidth, pointerRelativeXpos - 8))

    var containerOffsetWidth = wrapper.offsetWidth;
    var barWidth = bar.offsetWidth;


    codeEditor.style.width = editorWidth + 'px';
    codeEditor.style.flexGrow = '0';

    interactions.style.width = containerOffsetWidth-editorWidth-barWidth + 'px';
    interactions.style.flexGrow = '0'

  });

  document.addEventListener('mouseup', function(e){
    isDragging = false;
  });
}


function promptTextArea(){
  var nextCode = document.getElementById("next-code") as HTMLTextAreaElement;
  document.getElementById("interactions").addEventListener("click", (e)=>{
    nextCode.focus();
  });

  nextCode.addEventListener("focus", (e)=>{
    var source = ""
    nextCode.addEventListener("keyup", (e)=>{
      source = nextCode.value;
      var before = document.querySelector(".prompt-text") as HTMLSpanElement;
      before.innerHTML = source.substring(0, nextCode.selectionStart);
      var after = document.getElementById("prompt-text-after") as HTMLSpanElement;
      after.innerHTML = source.substring(nextCode.selectionStart);
    })   
  });

}

function printGlobalVariable(repl: BasicREPL){
  const globalVariable = repl.currentEnv.globals;
  globalVariable.forEach((value: boolean, key: string)=>{
    repl.run(key).then(r =>{
      var objectTrackList = repl.trackObject(r, repl.trackHeap());
      //Find a way to display variable
    })
  })
}

webStart();
/*
  function stringify(typ: Type, arg: number): string {
    throw new Error('Function not implemented.');
  }
*/ 
