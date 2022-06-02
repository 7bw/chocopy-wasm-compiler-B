import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import { stringifyTree } from './treeprinter'
import {parser} from 'lezer-python'

// entry point for debugging
async function debug() {
  var source = `
  factorial(45)
  `

  const t = parser.parse(source);
  console.log(stringifyTree(t.cursor(), source, 0));
`
  set_1 : set[int] = None
  a : int = 0
  b : bool = True
  set_1 = set({1,2})

  // set_1 : set[int] = None
  // a : int = 0
  // b : bool = True
  // l: [int] = None
  // set_1 = set([1, 2, 3])

  // set_1.add(3)
  // set_1.add(3)
  // set_1.remove(1)
  // a = len(set_1)
  // b = 1 in set_1
  // print(a)
  // print(b)
  `
  const ast = parse(source);
  console.log(ast)
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.tc(source);
  console.log(result);
  const result2 = repl.run(source).then(result2 => {
    console.log(result);
  })
}

debug();
