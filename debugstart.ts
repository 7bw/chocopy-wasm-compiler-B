import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";

// entry point for debugging
async function debug() {
  var source = `
  s:set[int] = None
  b:bool = True
  s.add(b)`


  // set_1.add(3)
  // set_1.add(3)
  // set_1.remove(1)
  // a = len(set_1)
  // b = 1 in set_1
  // print(a)
  // print(b)
  const ast = parse(source);
  // console.log(ast);
  const repl = new BasicREPL(await addLibs());
  const result = repl.tc(source);
  // console.log(result);
  // const result = repl.run(source).then(result => {
  //   console.log(result);
  // })
}

debug();

