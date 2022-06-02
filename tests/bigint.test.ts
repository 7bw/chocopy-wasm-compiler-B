import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("big number tests", () => {
  // 1
  assertPrint(
    "Test for initial compilation", 
    `
print(999999999999999999999999999999999999999999999999)
    `, 
    [`999999999999999999999999999999999999999999999999`]
  ),
  // 2
  assertPrint(
    "Basic assignment and printing", 
    `
x: int = 999999999999999999999999999999999999999999999999 
print(x)
    `, 
    [`999999999999999999999999999999999999999999999999`]
  ),
  // 3
  assertPrint(
    "More complex assignment, addition, and printing",
    `
x: int = 999999999999999999999999999999999999999999999999 
y: int = 1 
print(x + y)
    `,
    [`1000000000000000000000000000000000000000000000000`]
  ),
  // 4
  assertPrint(
    "Basic addition", 
    `
print(1000000000000000000000000000 + 1000000000000000000000000000)
    `, 
    [`2000000000000000000000000000`]
  ),
  // 5
  assertPrint(
    "Basic subtraction", 
    `
print(5000000000000000000000000000 - 2000000000000000000000000000)
    ` , 
    [`3000000000000000000000000000`]
  ),
  // 6
  assertPrint(
    "Multiply i32s to get BigNum",
    `
print(10000 * 300000)
    `,
    [`3000000000`]
  ),
  // 7
  assertPrint(
    "Divide",
    `
print(30000000000000000000000000000 // 30000000000)
    `,
    [`1000000000000000000`]
  ),
  // 8
  assertPrint(
    "Modulo", 
    `
print(100000000000000000000000000000 % 6)
    `, 
    [`4`]
  ),
  // 9
  assertPrint(
    "Complex operations",
    `
x:int = 5000000000000000 
x = x * x * x - x 
print(x)
    `, 
    [`124999999999999999999999999999995000000000000000`]
  ),
  // 10
  assertPrint(
    "Comparison Operator",
    `
x:int = 1000000000000000000 
y: int = 2000000000000000000 
print(y > x)
    `, 
    [`True`]
  ),
  // 11
  assertPrint(
    "Equality Operator", 
    `
x:int = 1000000000000000000 
y: int = 2000000000000000000 
print(y == x)
    `, 
    [`False`]
  ),
  // 12
  assertPrint(
    "Inequality Operator", 
    `
x:int = 1000000000000000000 
y: int = 2000000000000000000 
print(y != x)
    `,
    [`True`]
  ),
  // 13
  assertPrint(
    "negative number",
    `
x : int = 10
y : int = 20
x = -10
print(x + y)
    `,
    [`10`]
  ),
  // 14
  assertPrint(
    "mutiplying negative number",
    `
x : int = 10
y : int = 20
x = -x
y = -y
print(x * y)
    `,
    [`200`]
  ),
  // 15
  assertPrint(
    "dividing negative number",
    `
x : int = 10
y : int = 20
x = -x
y = -y
print(y // x)
    `,
    [`2`]
  ),
  // 16
  assertPrint(
    "minusing negative number",
    `
x : int = 10
y : int = 20
x = -x
y = -y
print(x - y)
    `,
    [`10`]
  ),
  // 17
  assertPrint(
    "adding tests on bignums where the majority of the digits are not 0's",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x + y)
    `,
    [`23569023457665544221`]
  ),
  // 18
  assertPrint(
    "minusing tests on bignums where the majority of the digits are not 0's",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x - y)
    `,
    [`1122334344309764421`]
  ),
  // 19
  assertPrint(
    "multiplying tests on bignums where the majority of the digits are not 0's",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x * y)
    `,
    [`138559808091892864182427857364897257900`]
  ),
  // 20
  assertPrint(
    "divide bignums to get i32",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(x // y)
    `,
    [`1`]
  ),
  // 21
  assertPrint(
    "abs bignum",
    `
x : int = 12345678900987654321
print(abs(x))
    `,
    [`12345678900987654321`]
  ),
  // 22
  assertPrint(
    "abs negative bignum",
    `
x : int = 12345678900987654321
x = -x
print(abs(x))
    `,
    [`12345678900987654321`]
  ),
  // 23
  assertPrint(
    "min bignums",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(min(x, y))
    `,
    [`11223344556677889900`]
  ),
  // 24
  assertPrint(
    "max bignums",
    `
x : int = 12345678900987654321
y : int = 11223344556677889900
print(max(x, y))
    `,
    [`12345678900987654321`]
  ),
  // 25
  assertPrint(
    "pow bignum",
    `
x : int = 12345678900987654321
y : int = 3
print(pow(x, y))
    `,
    [`1881676372240757194277820616164488626666147700309108518161`]
  ) 
//   // 26 
//   assertPrint(
//     "List w/ big numbers", 
//     `
// list1: [int] = None
// list1 = [3254324322343, 893743453, 34, 5653543373]
// print(list1[3])
// `, 
// [`5653543373`]
//   ), 
//   // 27 
//   assertPrint(
//     "Large number list comprehension", 
//     `print([4325894324232 for i in range(4)])`, 
//     [`[4325894324232, 4325894324232, 4325894324232, 4325894324232]`]
//   ), 
//   // 28 
//   assertPrint(
//     `Generator comprehension Range test`, 
//     `
// gen : generator = None
// gen = (val for val in range(3829532432432432, 3829532432432434, 1))
// print(next(gen))
// `, 
// [`3829532432432432`]
//   ), 
//   // 29
//   assertPrint(
//     `String indexing`, 
//     `s:str = "WASMisthebest"
//     print(s[10])`, 
//     [`e`]
//   ), 
//   // 30
//   assertPrint(
//     `String comparison`, 
//     `
// s1:str = "ab"
// s2:str = "abc"
// print(s1 < s2)
// `, 
// [`True`]
//   ), 
//   // 31
//   assertPrint(
//     `String comparison 2`, 
//     `
// s1:str = "abcd"
// s2:str = "abc"
// print(s1 < s2)
// `, 
// [`False`]
//   ), 
//   // 32 
//   assertPrint(
//     `Big numbers within Sets`, 
//     `set1: set[int] = None 
//     set1 = {578329573294, 458470243212321}
//     set1.add(7583924132123214)
//     print(458470243212321 in set1)
//     print(9 in set1)`, 
//     [`True`,
//     `False`]
//   ), 
//   // 33 
//   assertPrint(
//     `For loops range function`, 
//     `i:int = 0
//     for i in range(0,45732100000, 100000): 
//       if i == 45732000000: 
//         print(i)`, 
//     [`45732000000`]
//   ), 
//   // 34
//   assertPrint(
//     `More complex For loop w/ negative range`, 
//     `i:int = 432432500
//     i = -1*i
//     x:int = 0
//     for i in range(0,-59281421500, -500):
//       x = x + 1
//       if i == -58281421500: 
//         break
//     print(x)`, 
//     [`116562844`]
//   ), 
//   // 35
//   assertPrint(
//     `Builtins Factorial`, 
//     `print(factorial(45))`, 
//     [`119622220865480194561963161495657715064383733760000000000`]
//   ), 
//   // 36 
//   assertPrint(
//     `Builtins Perm`, 
//     `print(perm(32523758932432,2))`, 
//     [`1057794895094917784582502192`]
//   )
});
