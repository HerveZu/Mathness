import type { Token } from 'leac';

export interface ASTNode {
  evaluate: (x: number) => number;
  compare: (other: ASTNode) => boolean;
  subExpressions: ASTNode[];
  boundaries: { similar: ASTBoundary; match: ASTBoundary };
}
export type ASTBoundary = { start: number; end: number };

export type TokenWithPosition = Token & { position: number };

export class Unary implements ASTNode {
  constructor(
    public operator: TokenWithPosition,
    public right: ASTNode,
  ) {}

  get subExpressions() {
    return [this.right];
  }

  evaluate(x: number) {
    const right = this.right.evaluate(x);

    switch (this.operator.text) {
      case '+':
        return +right;
      case '-':
        return -right;
      default:
        throw new Error(`Operator ${this.operator} is not supported`);
    }
  }

  get boundaries() {
    return {
      similar: {
        start: this.operator.position,
        end: this.operator.position + 1,
      },
      match: {
        start: this.operator.position,
        end: this.right.boundaries.match.end,
      },
    };
  }

  compare(other: ASTNode): boolean {
    return (
      other instanceof Unary &&
      this.operator.text === other.operator.text &&
      this.right.compare(other.right)
    );
  }
}

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

  get boundaries() {
    return {
      similar: {
        start: this.operator.position,
        end: this.operator.position + 1,
      },
      match: {
        start: this.left.boundaries.match.start,
        end: this.right.boundaries.match.end,
      },
    };
  }

  compare(other: ASTNode): boolean {
    return (
      other instanceof BinaryNode && this.operator.text === other.operator.text
    );
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

  evaluate(x: number): number {
    switch (this.name.text) {
      case 'sin':
        return Math.sin(this.argument.evaluate(x));
      case 'cos':
        return Math.cos(this.argument.evaluate(x));
      case 'tan':
        return Math.tan(this.argument.evaluate(x));
      case 'log':
        return Math.log(this.argument.evaluate(x));
      case 'sqrt':
        return Math.sqrt(this.argument.evaluate(x));
      case 'abs':
        return Math.abs(this.argument.evaluate(x));
      case '-':
        return -this.argument.evaluate(x);
      case '+':
        return this.argument.evaluate(x);
      default:
        throw new Error(`Function ${this.name.text} is not supported`);
    }
  }

  get boundaries() {
    const isUnary = this.name.text === '-' || this.name.text === '+';
    return {
      similar: { start: this.name.position, end: this.name.position + 1 },
      // account for the closing paren if it's a function, or just the argument end if it's unary
      match: {
        start: this.name.position,
        end: isUnary
          ? this.argument.boundaries.match.end
          : this.argument.boundaries.match.end + 1,
      },
    };
  }

  compare(other: ASTNode): boolean {
    return other instanceof FunctionNode && this.name.text === other.name.text;
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

  get boundaries() {
    return {
      similar: {
        start: this.variable.position,
        end: this.variable.position + 1,
      },
      match: { start: this.variable.position, end: this.variable.position + 1 },
    };
  }

  compare(other: ASTNode): boolean {
    return other instanceof VariableNode;
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

  get boundaries() {
    return {
      similar: { start: this.value.position, end: this.value.position + 1 },
      match: { start: this.value.position, end: this.value.position + 1 },
    };
  }

  compare(other: ASTNode): boolean {
    return other instanceof NumberNode && this.value.text === other.value.text;
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

  get boundaries() {
    return {
      similar: { start: this.value.position, end: this.value.position + 1 },
      match: { start: this.value.position, end: this.value.position + 1 },
    };
  }

  compare(other: ASTNode): boolean {
    return other instanceof ConstNode && this.value.text === other.value.text;
  }
}
