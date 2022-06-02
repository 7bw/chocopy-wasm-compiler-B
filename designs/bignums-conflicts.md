# Bignums Compiler B conflicts with other groups: #

## Built-in libraries/Modules/FFI: ##

As all of the built-ins implemented in week 7 by this group were mathematical function, there will certainly be interactions between bignums and the builtin functions. Some collaboration on implementation will be necessary. 

1: Due to our new implementation of all integers being stored on the heap, builtin function cases such as: 

```
pow(2,2) 
```

now return 0 instead of the expected 4.

2: The standard javascript library functions (abs, min, max, and pow) included in builtinlib.ts will need to be updated. Furthermore, the custom functions made (randint, gcd, etc. ) will need to be updated so they accept Javascript "Bigint" instead of "number". Our group has a builtin function that reconstructs bigints given the memory address, this can be used to easily create custom javascript functions. 

## Closures/first class/anonymous functions ##

Apart from integers being used in closures, the changes made by closures and bignums should not interact. 
To use the closure group's example from design.md, their focus is changing a nested function from this : 

```
def getAdder(a:int) -> Callable[[int], int]:
    def adder(b: int) -> int:
        return a + b
    return adder
f: Callable[[int], int] = None
f = getAdder(1)
f(2)
```

To look like this according to the AST:

```
class Closure1(Callable[[int], int]):
    a: int = 0
    def __call__(self: Closure1, b: int) -> int:
        return self.a + b

def getAdder(a:int) -> Callable[[int], int]:
    adder: Closure1 = None
    adder = Closure1()
    adder.a = a
    return adder

f: Callable[[int], int] = None
f = getAdder(1)
f.__call__(2)  # need inheritance to work
```

Closures's changes were mostly to the parser and AST, changing the way the function is represented in the AST, whereas the changes we made would effect how the integers in this function are stored in memory, mostly changing the compiler, webstart, and runner. I don't forsee any conflicts. 

## Comprehensions ##

1: The following function will conflict with our implementation: 

```
x:int = 5
[3 for _ in range(x)]
```

due to the way we have changed the representation of numbers. 

2: The comprehension "Range" and "generator" classes in repl will need to be updated so each "number" is now a bigint type. A function or class taking input (ie Range in this case) may need to be updated to reconstruct any numerical parameters from the memory representation of integers into a javascript bigint for correct behavior. Otherwise, the range in the comprehension would be the numerical value of x, as opposed to its value of 5. 

## Destructing assignment ##

Could not find a pull request for destructuring assignment. 

## Error reporting ##

Our current implementation includes many of the merged changes from error reporting, including the SourceLocation type in the AST, and the changes including the SourceLocation in the parser and type-checker. 

The following program

```
x: int = 4
	
if (x == 4)::
	print(x)
```

Currently throws "Error: PARSE ERROR: Could not parse stmt at 25 26: :at line 3", and the error reporting group plans to update the error that's printed if anything. There is little to no interaction with bignums. 

## Calling Conventions ##

Calling conventions is concerned with allowing default values for function parameters, and is unlikely to interact with bignums.
The following function showcases this: 

```
def test(x : int, y : int = 1+5) -> int:
    return x + y

print(test(3))
```

Expected = 9

In this function, our implementation of numbers and our binop function would be used to add the default function parameters and the arguments in the return statement. However, this is done in the compiler, whereas calling convention's changes to default variables mostly occurs in the AST/lower/IR. Therefore, there is unlikely to be interaction with these changes. 

## for Loops/Iterators##

Similar to the builtins group, for loops/iterators will have a conflict with bignums and will have to change their imported javascript functions. 

Take the function: 

```
x:int = 5

for i in range(0,x,1): 
    print(i)
```

Expected = [0,1,2,3,4] 
Actual = [0,1,2,3]

I'm unsure when the imported functions such as $range$__init__, $range$__hasnext__, etc. functions are called specifically, but we will have to be very careful to make sure that if these functions are calling numbers from memory (in this case, "x"), that they are first converted from their WASM memory representation into their javascript bigint representation in the $range functions.

Currently, the $range$index function would accept the memory address of x (4), as opposed to the value. We will need to work on this with them. 

Also, any functions with using number types will need to be changed to bigint, to support extra large numbers. 

## Front-end user interface ##

Bignums has not changed the UI of anything in the compiiler, and the Front-end group has not made significant changes to the areas to the areas we updated (compiler's codeGen of binop/numbers, imports from webstart, functions in runner, etc.). The most relevant example: 

```
x:int = 5
print(x)
```

expected = 5

The Front End group had discussed in their designs that they would like to display what space has been used by the heap, so this is a possible source of collaboration between Front End/Memory Management/Bignums. Otherwise, it seems that Front-End/bignum interactions will not break anything. 

## Generics ##

Interactions between generics and bignums are unlikely to occur. 

```
T: TypeVar = TypeVar('T')

class Adder(Generic[T]):
   def add(self: Printer, x: T, y: T) -> T:
       return x + y

a: Adder[int] = None
a = Adder[int]()
print(a.add(4, 6))
```

In this function, our implementations of $binop and the bignums will be used in the compiler, however most of the changes done by the generics group was done to the AST and in a new file called "remove-generics.ts". As long as this file supports integers that can be arbitrarily large then there should be no conflicts. 

## Module Import Support ##

I'm not certain how the current Module Import support implementation works, but there is possibility for conflict with bignums.
Below is a function to represent this: 

```
# lib.py 
def distance(x:int, y:int) -> int: 
    return x + y

# main.py 
import lib 
x:int = 5
y:int = 7
lib.distance(5,7) 
```
Expected: 12 

Where lib.py is a module to be imported into our environment. 

Like previous groups, we must make sure that imported functions/classes are taking in heap memory addresses as input, reconstructing big numbers inside of the function, executing their purpose, then finally returning these values as deconstructed big numbers on the heap. There will be built-in functions to aid with this. 

## I/O, files ##

The current implementation of I/O is very limited, and will largely depend on the strings group and other groups' implementations to see how it will function. But, similar problems could persist with bignums: 

```
# test.txt 
'1234'

#main.py 
f = open(0)

f.read()
f.close()
```
Expected: 1

This has the potential to cause conflicts depending on how strings are implemented and how the open/read files are implemented. We will need to ensure that if numbers are being read, the memory address is taken as input and reconstructed into a bigint before anything can be done. However, it seems more implementation with both the strings and file, I/O group will need to be done before we can tackle this issue. 

## Inheritance ##

Inheritance at this time does not seem to interact with bignums. There is unlikely to be conflicts even with multiple inheritance being added in the future. 

```
class A(object):
    x : int = 1
    def foo(self : A):
        print(self.x)

class B(A):
    def foo2(self : B):
        print(self.x * 2)

class C(B):
    def foo3(self : C, arg : int):
        self.foo()
        self.foo2()
        print(self.x + self.arg)
c : C = None
c = C()
c.foo3(3)
```
Expected =\n 
1\n
2\n
3\n

In this example from Inheritance groups' testing, the only possible conflict is during code generation in the compiler. To explain this example, it is best to look at the compiler.ts of the inheritance group: 

```
# Inheritance compiler.ts 
case "call-indirect":

    var valStmts = expr.arguments.map((arg) => codeGenValue(arg, env)).flat(); // load arguments onto stack
     // duplicate the address
     valStmts.push(...codeGenValue(expr.arguments[0], env));

      valStmts.push(`(i32.load)`); // load the class offset

      valStmts.push(`(i32.add (i32.const ${expr.method_offset}))`); // add the method offset

      valStmts.push(`(call_indirect (type $${expr.name}))`); // expr.name already includes the class name
      
      return valStmts;
```

When generating valStmts, any bignum related code generation (class variables, parameters, etc) should be handled here. All the other expressions are hardcoded in before the call_indirect. From this, it doesn't appear that any conflicts will occur when generating inheritance code. However this is worth testing to ensure. 

## Optimization ##

Optimization group's focus appears to be on eliminating dead and unreachable code, implementing liveness analysis, and constant folding, which occurs at the ast/ir level. As our bignum implementation at the ast and ir level is already quite simple and hasn't changed much from the baseline compiler, I don't believe there will be conflicts that break anything. Furthermore, most of our changes occured in how numbers are represented during code generation, and optimization appears to be staying away from that at this time. 

An example of constant folding from optimization tests: 

### Before optimization ###
```
x:int = 5 
x = x * 0 
```
### After ###
```
x:int = 5 
x = 0
```

From this example, we can see that the second line has been optimized from a binop nested within an assignment, to a simple number nested within an assignment. Both of these implementations would result in the x pointing to the same address on the heap, which stores the same value, just with less wasm code for the binop. So this optimization both doesn't cause any conflicts, and results in less wasm code being generated for our case. Nice. 

## Sets/Tuples/Dicts##

The sets implementation is not finished, due to strings still needing to be added, and different method calls for sets needing to be included. However, there is still possibility for conflicts with this branch, due to sets' use of numbers both as values and for representation in memory. 

```
set_1 : set[int] = {}
set_1.add(5)  
print(set_1)
```

Currently, most of the code generation for sets is done via hard coding WAT code in the compiler. Hopefully, this portion does not have direct conflicts with bignums. However, because each of the method calls (such as "add" in this case) take i32s currently, they will need to be updated to take memory addresses as parameters. We also have some confusion about how these values are then stored in memory. Collaboration with the sets group will be necessary to make sure this implements without problem. 


## Discussions

# String Group

Since the string group uses big numbers for indexing, we set up a meeting with them to talk about how the numbers can be used. However, they think that our design is not the best possible design and proposed another idea. We add the functions according to their ideas in webstart.ts, so they can use it if they want. Also, we have a piazza post 534 about this discussion, and we will not which design we should go for after the discussion with instructors.

# Builtin Group

For the builtin group, we have modified the functions like abs(), min(), max(), and pow(), so they can use the functions directly. We also added new tests for these builtin functions and passed them. The meeting with the builtin group went well and they will change their code according to our design and implementation.

# Memory Group

We talked to the memory group in class, and it seems that both groups wouldn't need to worried about the interaction, except that the memory.wat functions will take in one more operator in the future, and we will need to modify our code for that.

# List, Set, For Group

We have contacted these groups via email and provided details about our implementation and suggestions about resolving the conflicts. However, these groups said that they need more time to discuss within the groups and will get back to us when they are ready. Thus, we are not really able to make progress with these features, but I guess our siggestions will be helpful for their discussions.

# To create a new pull request