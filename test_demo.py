#!/usr/bin/env python3
"""
Test demonstration of the commit agents
"""

def calculate_sum(a, b):
    """Calculate the sum of two numbers"""
    return a + b

def calculate_product(a, b):
    """Calculate the product of two numbers"""
    return a * b

class MathOperations:
    """A class for mathematical operations"""
    
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        """Add two numbers and store in history"""
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def multiply(self, a, b):
        """Multiply two numbers and store in history"""
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result
    
    def get_history(self):
        """Get calculation history"""
        return self.history

if __name__ == "__main__":
    # Test the functions
    print("Testing basic functions:")
    print(f"Sum: {calculate_sum(5, 3)}")
    print(f"Product: {calculate_product(4, 6)}")
    
    # Test the class
    print("\nTesting MathOperations class:")
    math_ops = MathOperations()
    math_ops.add(10, 5)
    math_ops.multiply(3, 7)
    
    print("History:")
    for operation in math_ops.get_history():
        print(f"  {operation}")