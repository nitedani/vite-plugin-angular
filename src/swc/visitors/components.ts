import {
  ArrayExpression,
  CallExpression,
  Decorator,
  Identifier,
  KeyValueProperty,
  ModuleItem,
  ObjectExpression,
  StringLiteral,
  TsType,
} from '@swc/core';
import { Visitor } from '@swc/core/Visitor.js';
import { dirname, extname, join } from 'path';
import {
  createArrayExpression,
  createExpressionStatement,
  createIdentifer,
  createImportDefaultSpecifier,
  createKeyValueProperty,
  createSpan,
  createStringLiteral,
} from 'swc-ast-helpers';

const randomIdentifier = () =>
  Math.random().toString(36).substring(2, 15).replace(/\d/g, '');

const isComponentDecorator = (decorator: Decorator) =>
  decorator.expression.type === 'CallExpression' &&
  (decorator.expression?.callee as Identifier).value === 'Component';

export interface AngularComponentOptions {
  sourceUrl: string;
}
export class AngularComponents extends Visitor {
  importFiles: {
    url: string;
    identifier: string;
  }[] = [];

  constructor(private options: AngularComponentOptions) {
    super();
  }
  override visitTsTypes(nodes: TsType[]): TsType[] {
    return nodes;
  }
  override visitTsType(nodes: TsType): TsType {
    return nodes;
  }
  override visitModuleItems(items: ModuleItem[]): ModuleItem[] {
    const files = [...items.flatMap(item => this.visitModuleItem(item))];
    if (this.importFiles.length) {
      for (const { url, identifier } of this.importFiles) {
        files.unshift({
          type: 'ImportDeclaration',
          span: createSpan(),
          typeOnly: false,
          specifiers: [createImportDefaultSpecifier(identifier)],
          source: createStringLiteral(url),
        });
      }
    }
    return files;
  }

  override visitDecorator(decorator: Decorator) {
    if (!isComponentDecorator(decorator)) return decorator;

    const componentOptions = (decorator.expression as CallExpression)
      .arguments[0].expression as ObjectExpression;

    //@ts-ignore
    decorator.expression.arguments = [
      {
        expression: {
          ...componentOptions,
          properties: componentOptions.properties.map(prop => {
            switch (((prop as KeyValueProperty).key as Identifier).value) {
              case 'styleUrls': {
                return this.transformStyleUrls(prop);
              }

              case 'templateUrl': {
                return this.transformTemplateUrl(prop);
              }

              default:
                return prop;
            }
          }),
        },
      },
    ];

    return decorator;
  }

  private transformTemplateUrl(prop) {
    const templateUrl = ((prop as KeyValueProperty).value as Identifier).value;
    const actualImportPath = join(dirname(this.options.sourceUrl), templateUrl);

    if (extname(actualImportPath) !== '.html') {
      throw new Error(
        `HTML type ${extname(actualImportPath)} is not supported.`
      );
    }
    const identifier = randomIdentifier();
    this.importFiles.push({
      identifier,
      url: templateUrl + '?raw',
    });
    return createKeyValueProperty(
      createIdentifer('template'),
      createIdentifer(identifier)
    );
  }

  private transformStyleUrls(prop) {
    const styleUrls = (prop as KeyValueProperty).value as ArrayExpression;

    const styles = styleUrls.elements.map(e => {
      const styleUrl = (e?.expression as StringLiteral).value;
      const identifier = randomIdentifier();
      this.importFiles.push({
        url: styleUrl,
        identifier,
      });
      return identifier;
    });

    return {
      ...prop,
      key: createIdentifer('styles'),
      value: createArrayExpression(
        styles.map(c => createExpressionStatement(createIdentifer(c)))
      ),
    };
  }
}
