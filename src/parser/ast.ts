import type { Token } from 'leac';

export interface ASTNode {
  evaluate: (x: number) => number;
  compare: (other: ASTNode) => CompareResult;
  subExpressions: ASTNode[];
}

export type SimilarCompareResult = {
  similar: true;
  start: number;
  end: number;
};

export type TokenWithPosition = Token & { position: number };

export type CompareResult = { similar: false } | SimilarCompareResult;

export class BinaryNode implements ASTNode {
  constructor(
    public operator: TokenWithPosition,
    public left: ASTNode,
    public right: ASTNode,
  ) {}

  get subExpressions() {
    return [this.left, this.right];
  }

  evaluate(x: number) {
    const left = this.left.evaluate(x);
    const right = this.right.evaluate(x);

    switch (this.operator.text) {
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

  compare(other: ASTNode): CompareResult {
    if (
      other instanceof BinaryNode &&
      this.operator.text === other.operator.text
    ) {
      return {
        similar: true,
        start: this.operator.position,
        end: this.operator.position + 1,
      };
    }

    return { similar: false };
  }
}

export class FunctionNode implements ASTNode {
  constructor(
    public name: TokenWithPosition,
    public argument: ASTNode,
  ) {}

  get subExpressions() {
    return [this.argument];
  }

  evaluate(x: number) {
    switch (this.name.text) {
      case 'sin':
        return Math.sin(this.argument.evaluate(x));
      case 'cos':
        return Math.cos(this.argument.evaluate(x));
      case 'tan':
        return Math.tan(this.argument.evaluate(x));
      case 'log':
        return Math.log(this.argument.evaluate(x));
      default:
        throw new Error(`Function ${this.name.text} is not supported`);
    }
  }

  compare(other: ASTNode): CompareResult {
    if (other instanceof FunctionNode && this.name.text === other.name.text) {
      return {
        similar: true,
        start: this.name.position,
        end: this.name.position + 1,
      };
    }

    return { similar: false };
  }
}

export class VariableNode implements ASTNode {
  public constructor(public variable: TokenWithPosition) {}
  evaluate(x: number) {
    return x;
  }

  get subExpressions() {
    return [];
  }

  compare(other: ASTNode): CompareResult {
    if (other instanceof VariableNode) {
      return {
        similar: true,
        start: this.variable.position,
        end: this.variable.position + 1,
      };
    }
    return { similar: false };
  }
}

export class NumberNode implements ASTNode {
  constructor(public value: TokenWithPosition) {}

  get subExpressions() {
    return [];
  }

  evaluate() {
    return parseFloat(this.value.text);
  }

  compare(other: ASTNode): CompareResult {
    if (other instanceof NumberNode && this.value.text === other.value.text) {
      return {
        similar: true,
        start: this.value.position,
        end: this.value.position + 1,
      };
    }

    return { similar: false };
  }
}

export class ConstNode implements ASTNode {
  constructor(public value: TokenWithPosition) {}

  get subExpressions() {
    return [];
  }

  evaluate() {
    switch (this.value.text) {
      case 'pi':
        return Math.PI;
      case 'e':
        return Math.E;
      default:
        throw new Error(`Const ${this.value.text} is not supported`);
    }
  }

  compare(other: ASTNode): CompareResult {
    if (other instanceof ConstNode && this.value.text === other.value.text) {
      return {
        similar: true,
        start: this.value.position,
        end: this.value.position + 1,
      };
    }

    return { similar: false };
  }
}
