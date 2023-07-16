import {
  Argument,
  CallExpression,
  ClassDeclaration,
  Identifier,
  MemberExpression,
  ModuleItem,
  NamedImportSpecifier,
  TsParameterProperty,
  TsType,
} from '@swc/core';
import { Visitor } from '@swc/core/Visitor.js';
import {
  createIdentifer,
  createImportSpecifier,
  createSpan,
  isCallExpression,
  isIdentifer,
  isImportDeclaration,
  isTsTypeAnnotation,
  isTsTypeReference,
} from 'swc-ast-helpers';

const hasInjectDecorator = node =>
  node.decorators?.length &&
  node.decorators.some(
    dec =>
      isCallExpression(dec.expression) &&
      isIdentifer(dec.expression.callee) &&
      dec.expression.callee.value === 'Inject',
  );

function createCallExpression(
  callee: MemberExpression | Identifier,
  args: Argument[] = [],
) {
  const object: CallExpression = {
    type: 'CallExpression',
    span: createSpan(),
    callee,
    arguments: args,
  };
  return object;
}

export class AngularInjector extends Visitor {
  private hasInjectorImport = false;
  private hasInjectedConstructor = false;
  private isAngularClass = false;

  override visitClassDeclaration(decl: ClassDeclaration) {
    this.isAngularClass = !!decl.decorators?.some(
      dec =>
        isCallExpression(dec.expression) &&
        isIdentifer(dec.expression.callee) &&
        ['NgModule', 'Component', 'Injectable', 'Directive'].includes(
          dec.expression.callee.value,
        ),
    );

    return super.visitClassDeclaration(decl);
  }

  override visitModuleItems(items: ModuleItem[]): ModuleItem[] {
    const result = items.flatMap(item => this.visitModuleItem(item));

    if (!this.hasInjectorImport && this.hasInjectedConstructor) {
      return result.map(res => {
        if (isImportDeclaration(res)) {
          if (!this.hasInjectorImport && res.source.value === '@angular/core') {
            res.specifiers.push(createImportSpecifier('Inject'));
            this.hasInjectorImport = true;
          }
        }
        return res;
      });
    }
    return result;
  }

  override visitConstructorParameter(
    node: TsParameterProperty,
  ): TsParameterProperty {
    if (hasInjectDecorator(node) || !node.param || !node.param.typeAnnotation) {
      return node;
    } else {
      if (
        this.isAngularClass &&
        isTsTypeAnnotation(node.param.typeAnnotation) &&
        isTsTypeReference(node.param.typeAnnotation.typeAnnotation) &&
        isIdentifer(node.param.typeAnnotation.typeAnnotation.typeName)
      ) {
        node.decorators = node.decorators ?? [];
        node.decorators.push({
          type: 'Decorator',
          span: createSpan(),
          expression: createCallExpression(createIdentifer('Inject'), [
            {
              expression: createIdentifer(
                node.param.typeAnnotation.typeAnnotation.typeName.value,
              ),
            },
          ]),
        });
        this.hasInjectedConstructor = true;
        return node;
      } else {
        return node;
      }
    }
  }

  override visitNamedImportSpecifier(
    node: NamedImportSpecifier,
  ): NamedImportSpecifier {
    if (!this.hasInjectorImport && node.local.value === 'Inject') {
      this.hasInjectorImport = true;
    }
    return node;
  }

  override visitTsTypes(nodes: TsType[]): TsType[] {
    return nodes;
  }

  override visitTsType(nodes: TsType): TsType {
    return nodes;
  }
}
