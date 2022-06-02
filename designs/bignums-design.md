# Bignums Designs #

Jeff Makings and Zach Lee 

## Initial design/ test cases ##
Test cases: 

1:
Test for initial compilation: 

```
999999999999999999999999999999999999999999999999
```

Expected: 999999999999999999999999999999999999999999999999

2: 
Basic assignment and printing: 

```
x: int = 999999999999999999999999999999999999999999999999 
print(x)
```

Expected: “999999999999999999999999999999999999999999999999” 

3: 
Unary operation: 

```
print(-999999999999999999999999999999999999999999999999)

```

Expected: “-999999999999999999999999999999999999999999999999”

4: 
Basic addition: 

```
x:int = 1000000000000000000000000000 + 1000000000000000000000000000
print(x) 
```

Expected: 2000000000000000000000000000

5:
Basic subtraction: 

```
x:int = 5000000000000000000000000000 - 2000000000000000000000000000
print(x)
```

Expected: 3000000000000000000000000000

6:
Multiply i32s to get BigNum: 

```
x:int = 10000*300000
print(x)
```

Expected: 3000000000

7:
Divide: 

```
x:int = 30000000000000000000000000000 // 30000000000 
print(x)
```

Expected: 1000000000000000000

8:
Comparison Operator: 

```
x:int = 1000000000000000000
y: int = 2000000000000000000
If y > x: 
	print(True)
Else: 
	print(False)
```

Expected: True 


9:
Equality Operator: 

```
x:int = 1000000000000000000
y: int = 2000000000000000000
If y == x: 
	print(True)
Else: 
	print(False)
Expected: False
```

10:
List Test (for when it’s implemented): 

```
x:int = 900000001
list1 = [3] * x
print(list1[x-1])
```

Expected: 3

The below is related to the concerns from instructors.

(1)
AST/IR
For parsing, we can store the value as a javaScript big number.
ex.
export type Literal<A>  = 
  { a?: A, tag: "num"  , value: javaScript big number }

(2)
We can store the big number like a class which looks like this.
class bigNum(object):
    size : int = 3
    0 : int = 1 // ranges from 0 to 2^32 - 1
    1 : int = 333
    2 : int = 5934739

With the first field, we can know how many bytes does a big number need
bignum.size = 3 

To reconstruct the number we need the following 3 fields bignum.0, bignum.1, and bignum.2.
The number would be 1 * (2^32) ^ 0 + 333 * (2^32) ^ 1 + 5934739 * (2^32) ^ 2. 

(3)
We can view all numbers as big numbers, so that we don't need to worry about conversion during arithmetic operations.

## Week 7 Milestone: ## 

This week, we implemented large numbers in the compiler. There is now no limit on the size of number that can be used in the compiler. We also implemented binary operations operations for these numbers, as well as changing all numbers so that all integers are now stored in the heap instead of the stack. 
The following is the list of changes we made: 
### ast.ts: ###
Changed type Literal.num to have value: bigint from value: int
Changed type Value.object to have address: bigint from address:int

### ir.ts: ###
Changed type Value.num to have value: bigint 
Changed type Value.wasmint to have value: bigint

### compiler.ts ### 
changed GlobalEnv offset to take bigint

compiler.ts/codeGenExpr: 
changed "uniop" to handle negative bigints 

compiler.ts/codeGenValue: 
changed "num" to first allocate memory for the bignumber, with the 0-index 4 byte memory block holding the "size" which is how many 4 byte blocks of memory are needed for this number. 
In a loop, the least significant digits of the bigint are determined by taking currentValue % (2^31), then storing them in the next index in the memory block, then updating currentValue = currentValue (floor division) 2^31. 
This way, the least significant digits are consistently being stored in memory as i32s without risking overflow. 

compiler.ts/codeGenBinOp: 
Changed Plus, Minus, Mul, IDiv, Mod, Eq, Neq, Lte, Gte, Lt, and Gt so that they call into custom imported javascript functions. 

### runner.ts: ###
added function declarations for imported javascript functions for arithmetic and comparison operators. 

### webstart.ts: ### 
created javascript function that takes the memory address of a bigint and reconstructs it into a javascript bigint. This is useful for printing and handling binary operations. 

created arithmeticOp javascript function that is imported into the wasm module. Takes two values and performs arithmetic binary operations on them (plus, minus, mul, div, mod). Allocates memory for the new bigint that was created and stores the bignumber in memory. 

created comparisonOp javascript function that is imported into the wasm module. Takes two values and performs comparison binary operations on them (eq, neq, lte, gte, lt, gt). Returns a boolean value. 

importObject.imports: 
created 12 new imported functions (plus, minus, mul, iDiv, mod, eq, neq,lte,gte,lt,gt) from the above arithmeticOp and comparisonOp functions to be imported into wasm. Each performs a binary operation. 


### Updated test cases: ### 

1.
Test for initial compilation: 
```
999999999999999999999999999999999999999999999999
```

Expected: 999999999999999999999999999999999999999999999999

2.
Basic assignment and printing: 
```
x: int = 999999999999999999999999999999999999999999999999 
print(x) 
```

Expected: 999999999999999999999999999999999999999999999999

3.
More complex assignment, addition, and printing: 

```
x: int = 999999999999999999999999999999999999999999999999
y: int =  1
print(x+y)
```

Expected: 1000000000000000000000000000000000000000000000000

4.
Basic addition: 

```
1000000000000000000000000000 + 1000000000000000000000000000 
```

Expected: 2000000000000000000000000000

5.
Basic subtraction: 

```
5000000000000000000000000000 - 2000000000000000000000000000” 
```

Expected: 3000000000000000000000000000

6.
Multiply i32s to get BigNum: 

```
10000*300000” 
```

Expected: 3000000000

7.
Divide: 

```
30000000000000000000000000000 // 30000000000
```

Expected: 1000000000000000000

8: 
Modulo: 

```
100000000000000000000000000000 % 6
```

Expected: 4

9: 
Complex operations: 

```
x:int = 5000000000000000
x = x * x * x - x
print(x)
```

Expected: 124999999999999999999999999999995000000000000000

10:
Comparison Operator: 

```
x:int = 1000000000000000000
y: int = 2000000000000000000
y > x
```

Expected: True 

11:
Equality Operator: 

```
x:int = 1000000000000000000
y: int = 2000000000000000000
y == x
```

Expected: False

12:
Inequality Operator: 

```
x:int = 1000000000000000000
y: int = 2000000000000000000
y != x
```

Expected: True

13: 
Negative number: 

```
x:int = 10
y:int = 20
x = -10 
print(x + y)
```

Expected: 10

14: 
Multiplying negative number: 

```
x : int = 10
y : int = 20
x = -x
y = -y
print(x * y)
```
Expected: 200

15: 
Dividing negative number: 

```
x : int = 10
y : int = 20
x = -x
y = -y
print(y // x)
```
Expected: 2

16: 
Subtract negative number: 

```
x : int = 10
y : int = 20
x = -x
y = -y
print(x - y)
```
Expected: 10 

17: 
adding tests on bignums where the majority of the digits are not 0s 

```
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x + y)
```

Expected: 23569023457665544221

18: 
Subtract tests on bignums where the majority of digits are not 0s: 

```
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x - y)
```

Expected: 1122334344309764421

19: 
Multiplying tests on bignums where the majority of the digits are not 0s: 

```
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x * y)
```

Expected: 138559808091892864182427857364897257900

20: 
Divide bignums to get i32: 

```
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x // y)
```

Expected: 1 

## Week 9 Milestone ## 

In week 9, our primary focus will be to ensure that our implementation of bignums works in conjunction with other groups's new additions. In week 7, we made sure that large integers could be stored on the heap, and that binary and unary operations could be performed on these large numbers. This week, we will expand to support large numbers in other data structures such as arbitrarily large strings, lists, sets, comprehensions, etc. 

We have already been in contact or are getting in touch with the strings, lists, memory management, sets, builtins, comprehensions, and for loop teams to discuss how our work will affect each other and try to come up with solutions for how to support operations involving large numbers/data structures. 

Due to the wide-ranging use of numbers in many of the other teams implementations, we believe working with other groups and providing them large number functionality for their data structures will be more than sufficient work for this milestone. 

## Test cases ## 

1: List w/ big numbers:

```
list1: [int] = None
list1 = [3254324322343, 893743453, 34, 5653543373]
print(list1[3])
```

Expected = 5653543373


2: Large number list comprehension: 

```
print([4325894324232 for i in range(4)])
```

Expected = [4325894324232, 4325894324232, 4325894324232, 4325894324232]


3: Generator comprehension Range test: 

```
gen : generator = None
gen = (val for val in range(3829532432432432, 3829532432432434, 1))
print(next(gen))
```

Expected: 3829532432432432


4: String indexing: 

```
s:str = "WASMisthebest"
print(s[10])
```

Expected: e


5: String comparison: (applicable because we modified the comparison operators)

```
s1:str = "ab"
s2:str = "abc"
print(s1 < s2)
```

Expected: True 

```
s1:str = "abcd"
s2:str = "abc"
print(s1 < s2)
```

Expected: False

6: Big numbers within Sets: 

```
set1: set[int] = None 
set1 = {578329573294, 458470243212321}
set1.add(7583924132123214)
print(7583924132123214 in set1)
print(9 in set1)
```

Expected: 
```
True
False
```


7: For loops range function: 

```
i:int = 0
for i in range(0,45732100000, 100000): 
  if i == 45732000000: 
    print(i)
```

Expected: 45732000000

8: More complex For loop w/ negative range: 

```
i:int = 432432500
i = -1*i
x:int = 0
for i in range(0,-59281421500, -500):
  x = x + 1
  if i == -58281421500: 
    break

print(x)
```

Expected: 116562844

9: Builtins Factorial: 

```
print(math.factorial(45))
```

Expected: 119622220865480194561963161495657715064383733760000000000

10: Builtins Perm: 

```
print(math.perm(32523758932432,2))
```

Expected: 1057794895094917784582502192