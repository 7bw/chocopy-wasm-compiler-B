# Set/Tuple/Dictionary: Merges and Planning

## Week 8 Update
Read the other features’ pull requests for your compiler, and for each of them, either:

Describe in a few sentences why your feature and that feature don’t really interact much. Give an example of a program that showcases your feature and theirs without interacting, and justify why it’s representative (that is, why there isn’t some other interesting interaction between your features)

Identify a place where your features overlap and will need more implementation to make them work together. This might be an opportunity for cool new stuff, or something that’s broken.
Describe it with a representatitve test case/scenario. This could be a Python program that will have an issue and crash the compiler because the two features were combined, or a novel combination of features that need good behavior. It could also be a UI interaction, a reason libraries won’t work well together, etc.
Describe what changes you think are needed to make these features work together: What should the new expected output be? What new additions to the compiler are needed to make them work together? Does their design need to change a bit, or does yours? How? Treat this like the first

### Compiler B: String
Our task overlap with the string group because string should be able to be stored in a set. In a set, two strings with exact same characters in the same postions should be considered same elements. Therefore, we might need a method to compare two strings when adding it to the set. 
A case is:
```python
set_1 : set[string] = None
set_1 = {"hello world"} #the set stores one string "hello world"
set_1.add("hi") #the set stores two strings "hello world" and "hi"
set_1.add("hello world") #the set still stores two strings "hello world" and "hi", it needs to compare the new "hello world" with the previous one and "hi" and get the results that the first comparation is same and the second is not. 
```

When storing the string in the set, we need the information of how long the string is in order to leave enough space for properly storing the string.
The above are the main overlap of our task with string group. 

### Compiler B: Optimization
our task does not overlap with the task of optimization group. How does the optimization work is to find out which line of code can be executed, which which cannot be reached. Therefore, in order to realize their goal, whether the code involves a set operation is not important. 
An example is:
```python
# 1
if True:
  set_1.add(1)
else:
  set_1.add(2)
  
# 2
if True:
  a = 1
else:
  a = 2
```
In the two examples, the optimization tool should eliminate the else line regardless of whether the operation is an set operation or an int operation. The optimization tool will only decide to eliminate according to the if statement condition.

### Compiler B: List
Set and List will overlap when we try to update the set with a list.
For instance: 
```python
set_1 : set[int] = None
set_1 = set()
set_1.update([1,2,3,1])
```
In the case above, we needs to identify the list inside udpate method and iterate through the elements in the list, find the duplicated elements to eliminate and store the uniqe elements. 
Even though there is overlap between our groups. There is not much sychornizations needed, as long as the list group can do the proper list type check to make sure the elements in a list are of the same type. The other process of updating with list should be done when compiling the set.udpate funciton.


### Compiler B: I/O, files
The work of I/O group does not overlap with our group's work. Because set does not involve in the I/O operation, the read file content will not be stored in set. And After reading the design description, we found that there is not similar expression with I/O group and our set group.
From the design doc, all the operations invloved in I/O and File functions are:
```python
f : File = None
f = open('test', 'wb')
f.read()
f.write(...)
f.close()
```
None of the above lines of code includes set.

### Compiler B: Inheritance
Inheritance has no connection with set. Inheritance is the feature of class. However, set does not belong to class in Python. Therefore, inheritance group does not need to consider how set is implemented, neither set group doesn't have to interact with the inheritance feature. 
Below is a basic inheritance operation:
```python
class A(object):
    x : int = 1
    def foo(self : A):
        print(self.x)

class B(A):
    def foo2(self : B):
        print(self.x * 2)
```
One has to define class to take use of inheritance. Hence, set is not one of the cases involved in inheritance. 

### Compiler B: Memory management
Our project has no conflict with memory management.
