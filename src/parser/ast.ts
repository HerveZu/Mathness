export interface ASTNode {
  evaluate: (x: number) => number;
}

export class BinaryNode implements ASTNode {
  constructor(
    public operator: string,
    public left: ASTNode,
    public right: ASTNode,
  ) {}

  evaluate(x: number) {
    const left = this.left.evaluate(x);
    const right = this.right.evaluate(x);

    switch (this.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '^':
        return left ** right;
      default:
        throw new Error(`Operator ${this.operator} is not supported`);
    }
  }
}

export class FunctionNode implements ASTNode {
  constructor(
    public name: string,
    public argument: ASTNode,
  ) {}

  evaluate(x: number) {
    switch (this.name) {
      case 'sin':
        return Math.sin(this.argument.evaluate(x));
      case 'cos':
        return Math.cos(this.argument.evaluate(x));
      case 'tan':
        return Math.tan(this.argument.evaluate(x));
      default:
        throw new Error(`Function ${this.name} is not supported`);
    }
  }
}

export class VariableNode implements ASTNode {
  evaluate(x: number) {
    return x;
  }
}

export class NumberNode implements ASTNode {
  constructor(public value: number) {}

  evaluate() {
    return this.value ?? 0;
  }
}

export class ConstNode implements ASTNode {
  constructor(public value: string) {}

  evaluate() {
    switch (this.value) {
      case 'pi':
        return Math.PI;
      case 'e':
        return Math.E;
      default:
        throw new Error(`Const ${this.value} is not supported`);
    }
  }
}
