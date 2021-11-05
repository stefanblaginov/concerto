/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const parser = require('./parser');
const ModelManager = require('../modelmanager');
const Factory = require('../factory');
const Serializer = require('../serializer');

const metaModelCto = `/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

namespace concerto.metamodel

/**
 * The metadmodel for Concerto files
 */
concept TypeIdentifier {
  o String name
  o String namespace optional
}

abstract concept DecoratorLiteral {
}

concept DecoratorString extends DecoratorLiteral {
  o String value
}

concept DecoratorNumber extends DecoratorLiteral {
  o Double value
}

concept DecoratorBoolean extends DecoratorLiteral {
  o Boolean value
}

concept DecoratorTypeReference extends DecoratorLiteral {
  o TypeIdentifier type
  o Boolean isArray default=false
}

concept Decorator {
  o String name
  o DecoratorLiteral[] arguments optional
}

concept Identified {
}

concept IdentifiedBy extends Identified {
  o String name
}

abstract concept Declaration {}

concept EnumDeclaration extends Declaration {
  o String name regex=/^(?!null|true|false)(\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4})(?:\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4}|\\p{Mn}|\\p{Mc}|\\p{Nd}|\\p{Pc}|\\u200C|\\u200D)*$/u
  o EnumProperty[] properties
}

concept EnumProperty {
  o String name regex=/^(?!null|true|false)(\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4})(?:\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4}|\\p{Mn}|\\p{Mc}|\\p{Nd}|\\p{Pc}|\\u200C|\\u200D)*$/u
  o Decorator[] decorators optional
}

concept ConceptDeclaration extends Declaration {
  o String name regex=/^(?!null|true|false)(\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4})(?:\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4}|\\p{Mn}|\\p{Mc}|\\p{Nd}|\\p{Pc}|\\u200C|\\u200D)*$/u
  o Decorator[] decorators optional
  o Boolean isAbstract default=false
  o Identified identified optional
  o TypeIdentifier superType optional
  o Property[] properties
}

concept AssetDeclaration extends ConceptDeclaration {
}

concept ParticipantDeclaration extends ConceptDeclaration {
}

concept TransactionDeclaration extends ConceptDeclaration {
}

concept EventDeclaration extends ConceptDeclaration {
}

abstract concept Property {
  o String name regex=/^(?!null|true|false)(\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4})(?:\\p{Lu}|\\p{Ll}|\\p{Lt}|\\p{Lm}|\\p{Lo}|\\p{Nl}|\\$|_|\\\\u[0-9A-Fa-f]{4}|\\p{Mn}|\\p{Mc}|\\p{Nd}|\\p{Pc}|\\u200C|\\u200D)*$/u
  o Boolean isArray default=false
  o Boolean isOptional default=false
  o Decorator[] decorators optional
}

concept RelationshipProperty extends Property {
  o TypeIdentifier type
}

concept ObjectProperty extends Property {
  o String defaultValue optional
  o TypeIdentifier type
}

concept BooleanProperty extends Property {
  o Boolean defaultValue optional
}

concept DateTimeProperty extends Property {
}

concept StringProperty extends Property {
  o String defaultValue optional
  o StringRegexValidator validator optional
}

concept StringRegexValidator {
  o String regex
}

concept DoubleProperty extends Property {
  o Double defaultValue optional
  o DoubleDomainValidator validator optional
}

concept DoubleDomainValidator {
  o Double lower optional
  o Double upper optional
}

concept IntegerProperty extends Property {
  o Integer defaultValue optional
  o IntegerDomainValidator validator optional
}

concept IntegerDomainValidator {
  o Integer lower optional
  o Integer upper optional
}

concept LongProperty extends Property {
  o Long defaultValue optional
  o LongDomainValidator validator optional
}

concept LongDomainValidator {
  o Long lower optional
  o Long upper optional
}

abstract concept Import {
  o String namespace
  o String uri optional
}

concept ImportAll extends Import {
}

concept ImportType extends Import {
  o String name
}

concept Model {
  o String namespace
  o Import[] imports optional
  o Declaration[] declarations optional
}

concept Models {
  o Model[] models
}
`;

/**
 * Create a metamodel manager (for validation against the metamodel)
 * @return {*} the metamodel manager
 */
function createMetaModelManager() {
    const metaModelManager = new ModelManager();
    metaModelManager.addModelFile(metaModelCto, 'concerto.metamodel');
    return metaModelManager;
}

/**
 * Validate against the metamodel
 * @param {object} input - the metamodel in JSON
 * @return {object} the validated metamodel in JSON
 */
function validateMetaModel(input) {
    const metaModelManager = createMetaModelManager();
    const factory = new Factory(metaModelManager);
    const serializer = new Serializer(factory, metaModelManager);
    // First validate the metaModel
    const object = serializer.fromJSON(input);
    return serializer.toJSON(object);
}

/**
 * Create a name resolution table
 * @param {*} modelManager - the model manager
 * @param {object} metaModel - the metamodel (JSON)
 * @return {object} mapping from a name to its namespace
 */
function createNameTable(modelManager, metaModel) {
    const table = {
        'Concept': 'concerto',
        'Asset': 'concerto',
        'Participant': 'concerto',
        'Transaction ': 'concerto',
        'Event': 'concerto',
    };

    // First list the imported names in order (overriding as we go along)
    const imports = metaModel.imports;
    imports.forEach((imp) => {
        const namespace = imp.namespace;
        const modelFile = modelManager.getModelFile(namespace);
        if (imp.$class === 'concerto.metamodel.ImportType') {
            if (!modelFile.getLocalType(imp.name)) {
                throw new Error(`Declaration ${imp.name} in namespace ${namespace} not found`);
            }
            table[imp.name] = namespace;
        } else {
            const decls = modelFile.getAllDeclarations();
            decls.forEach((decl) => {
                table[decl.getName()] = namespace;
            });
        }
    });

    // Then add the names local to this metaModel (overriding as we go along)
    if (metaModel.declarations) {
        metaModel.declarations.forEach((decl) => {
            table[decl.name] = metaModel.namespace;
        });
    }

    return table;
}

/**
 * Resolve a name using the name table
 * @param {string} name - the name of the type to resolve
 * @param {object} table - the name table
 * @return {string} the namespace for that name
 */
function resolveName(name, table) {
    if (!table[name]) {
        throw new Error(`Name ${name} not found`);
    }
    return table[name];
}

/**
 * Name resolution for metamodel
 * @param {object} metaModel - the metamodel (JSON)
 * @param {object} table - the name table
 * @return {object} the metamodel with fully qualified names
 */
function resolveTypeNames(metaModel, table) {
    switch (metaModel.$class) {
    case 'concerto.metamodel.Model': {
        if (metaModel.declarations) {
            metaModel.declarations.forEach((decl) => {
                resolveTypeNames(decl, table);
            });
        }
    }
        break;
    case 'concerto.metamodel.AssetDeclaration':
    case 'concerto.metamodel.ConceptDeclaration':
    case 'concerto.metamodel.EventDeclaration':
    case 'concerto.metamodel.TransactionDeclaration':
    case 'concerto.metamodel.ParticipantDeclaration': {
        if (metaModel.superType) {
            const name = metaModel.superType.name;
            metaModel.superType.namespace = resolveName(name, table);
        }
        metaModel.properties.forEach((property) => {
            resolveTypeNames(property, table);
        });
        if (metaModel.decorators) {
            metaModel.decorators.forEach((decorator) => {
                resolveTypeNames(decorator, table);
            });
        }
    }
        break;
    case 'concerto.metamodel.EnumDeclaration': {
        if (metaModel.decorators) {
            metaModel.decorators.forEach((decorator) => {
                resolveTypeNames(decorator, table);
            });
        }
    }
        break;
    case 'concerto.metamodel.EnumProperty':
    case 'concerto.metamodel.ObjectProperty':
    case 'concerto.metamodel.RelationshipProperty': {
        const name = metaModel.type.name;
        metaModel.type.namespace = resolveName(name, table);
        if (metaModel.decorators) {
            metaModel.decorators.forEach((decorator) => {
                resolveTypeNames(decorator, table);
            });
        }
    }
        break;
    case 'concerto.metamodel.Decorator': {
        if (metaModel.arguments) {
            metaModel.arguments.forEach((argument) => {
                resolveTypeNames(argument, table);
            });
        }
    }
        break;
    case 'concerto.metamodel.DecoratorTypeReference': {
        const name = metaModel.type.name;
        metaModel.type.namespace = resolveName(name, table);
    }
        break;
    }
    return metaModel;
}

/**
 * Resolve the namespace for names in the metamodel
 * @param {object} modelManager - the ModelManager
 * @param {object} metaModel - the MetaModel
 * @return {object} the resolved metamodel
 */
function resolveMetaModel(modelManager, metaModel) {
    const result = JSON.parse(JSON.stringify(metaModel));
    const nameTable = createNameTable(modelManager, metaModel);
    // This adds the fully qualified names to the same object
    resolveTypeNames(result, nameTable);
    return result;
}

/**
 * Create metamodel for an enum property
 * @param {object} ast - the AST for the property
 * @return {object} the metamodel for this property
 */
function enumPropertyToMetaModel(ast) {
    const property = {};

    property.$class = 'concerto.metamodel.EnumProperty';

    // Property name
    property.name = ast.id.name;

    return property;
}

/**
 * Create metamodel for a decorator argument
 * @param {object} ast - the AST for the decorator argument
 * @return {object} the metamodel for this decorator argument
 */
function decoratorArgToMetaModel(ast) {
    const decoratorArg = {};
    switch (ast.type) {
    case 'String':
        decoratorArg.$class = 'concerto.metamodel.DecoratorString';
        decoratorArg.value = ast.value;
        break;
    case 'Number':
        decoratorArg.$class = 'concerto.metamodel.DecoratorNumber';
        decoratorArg.value = ast.value;
        break;
    case 'Boolean':
        decoratorArg.$class = 'concerto.metamodel.DecoratorBoolean';
        decoratorArg.value = ast.value;
        break;
    default:
        decoratorArg.$class = 'concerto.metamodel.DecoratorTypeReference';
        decoratorArg.type = {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: ast.value.name,
        };
        decoratorArg.isArray = ast.value.array;
        break;
    }

    return decoratorArg;
}

/**
 * Create metamodel for a decorator
 * @param {object} ast - the AST for the decorator
 * @return {object} the metamodel for this decorator
 */
function decoratorToMetaModel(ast) {
    const decorator = {
        $class: 'concerto.metamodel.Decorator',
        name: ast.name,
    };
    if (ast.arguments && ast.arguments.list) {
        if (!ast.arguments.list[0]) {
            decorator.arguments = [];
        } else {
            decorator.arguments = ast.arguments.list.map(decoratorArgToMetaModel);
        }
    }
    return decorator;
}

/**
 * Create metamodel for a list of decorators
 * @param {object} ast - the AST for the decorators
 * @return {object} the metamodel for the decorators
 */
function decoratorsToMetaModel(ast) {
    return ast.map(decoratorToMetaModel);
}

/**
 * Create metamodel for a property
 * @param {object} ast - the AST for the property
 * @return {object} the metamodel for this property
 */
function propertyToMetaModel(ast) {
    const property = {};

    // Property name
    property.name = ast.id.name;
    // Is it an array?
    if (ast.array) {
        property.isArray = true;
    } else {
        property.isArray = false;
    }
    // Is it an optional?
    if (ast.optional) {
        property.isOptional = true;
    } else {
        property.isOptional = false;
    }
    // XXX Can it be missing?
    const type = ast.propertyType.name;

    // Handle decorators
    if (ast.decorators && ast.decorators.length > 0) {
        property.decorators = decoratorsToMetaModel(ast.decorators);
    }

    switch (type) {
    case 'Integer':
        property.$class = 'concerto.metamodel.IntegerProperty';
        if (ast.default) {
            property.defaultValue = parseInt(ast.default);
        }
        if (ast.range) {
            const validator = {
                $class: 'concerto.metamodel.IntegerDomainValidator',
            };
            if (ast.range.lower) {
                validator.lower = parseInt(ast.range.lower);
            }
            if (ast.range.upper) {
                validator.upper = parseInt(ast.range.upper);
            }
            property.validator = validator;
        }
        break;
    case 'Long':
        property.$class = 'concerto.metamodel.LongProperty';
        if (ast.default) {
            property.defaultValue = parseInt(ast.default);
        }
        if (ast.range) {
            const validator = {
                $class: 'concerto.metamodel.LongDomainValidator',
            };
            if (ast.range.lower) {
                validator.lower = parseInt(ast.range.lower);
            }
            if (ast.range.upper) {
                validator.upper = parseInt(ast.range.upper);
            }
            property.validator = validator;
        }
        break;
    case 'Double':
        property.$class = 'concerto.metamodel.DoubleProperty';
        if (ast.default) {
            property.defaultValue = parseFloat(ast.default);
        }
        if (ast.range) {
            const validator = {
                $class: 'concerto.metamodel.DoubleDomainValidator',
            };
            if (ast.range.lower) {
                validator.lower = parseFloat(ast.range.lower);
            }
            if (ast.range.upper) {
                validator.upper = parseFloat(ast.range.upper);
            }
            property.validator = validator;
        }
        break;
    case 'Boolean':
        property.$class = 'concerto.metamodel.BooleanProperty';
        if (ast.default) {
            if (ast.default === 'true') {
                property.defaultValue = true;
            } else {
                property.defaultValue = false;
            }
        }
        break;
    case 'DateTime':
        property.$class = 'concerto.metamodel.DateTimeProperty';
        break;
    case 'String':
        property.$class = 'concerto.metamodel.StringProperty';
        if (ast.default) {
            property.defaultValue = ast.default;
        }
        if (ast.regex) {
            const regex = ast.regex.flags ? `/${ast.regex.pattern}/${ast.regex.flags}` :  `/${ast.regex.pattern}/}`;
            property.validator = {
                $class: 'concerto.metamodel.StringRegexValidator',
                regex,
            };
        }
        break;
    default:
        property.$class = 'concerto.metamodel.ObjectProperty';
        if (ast.default) {
            property.defaultValue = ast.default;
        }
        property.type = {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: type
        };
        break;
    }

    return property;
}

/**
 * Create metamodel for a relationship
 * @param {object} ast - the AST for the relationtion
 * @return {object} the metamodel for this relationship
 */
function relationshipToMetaModel(ast) {
    let relationship = {
        $class: 'concerto.metamodel.RelationshipProperty',
        type: {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: ast.propertyType.name
        },
    };

    // Property name
    relationship.name = ast.id.name;
    // Is it an array?
    if (ast.array) {
        relationship.isArray = true;
    } else {
        relationship.isArray = false;
    }
    // Is it an optional?
    if (ast.optional) {
        relationship.isOptional = true;
    } else {
        relationship.isOptional = false;
    }

    return relationship;
}

/**
 * Create metamodel for an enum declaration
 * @param {object} ast - the AST for the enum declaration
 * @return {object} the metamodel for this enum declaration
 */
function enumDeclToMetaModel(ast) {
    let decl = {};

    decl.$class = 'concerto.metamodel.EnumDeclaration';

    // The enum name
    decl.name = ast.id.name;

    // Enum properties
    decl.properties = [];
    for (let n = 0; n < ast.body.declarations.length; n++) {
        let thing = ast.body.declarations[n];

        decl.properties.push(enumPropertyToMetaModel(thing));
    }

    return decl;
}

/**
 * Create metamodel for a concept declaration
 * @param {object} ast - the AST for the concept declaration
 * @return {object} the metamodel for this concept declaration
 */
function conceptDeclToMetaModel(ast) {
    let decl = {};

    if(ast.type === 'AssetDeclaration') {
        decl.$class = 'concerto.metamodel.AssetDeclaration';
    } else if (ast.type === 'ConceptDeclaration') {
        decl.$class = 'concerto.metamodel.ConceptDeclaration';
    } else if (ast.type === 'EventDeclaration') {
        decl.$class = 'concerto.metamodel.EventDeclaration';
    } else if (ast.type === 'ParticipantDeclaration') {
        decl.$class = 'concerto.metamodel.ParticipantDeclaration';
    } else if (ast.type === 'TransactionDeclaration') {
        decl.$class = 'concerto.metamodel.TransactionDeclaration';
    }

    // The concept name
    decl.name = ast.id.name;

    // Is the concept abstract?
    if (ast.abstract) {
        decl.isAbstract = true;
    } else {
        decl.isAbstract = false;
    }

    // Super type
    if (ast.classExtension) {
        const cname = ast.classExtension.class.name;
        if (cname !== 'Asset' &&
            cname !== 'Concept' &&
            cname !== 'Event' &&
            cname !== 'Participant' &&
            cname !== 'Transaction') {
            decl.superType = {
                $class: 'concerto.metamodel.TypeIdentifier',
                name: ast.classExtension.class.name
            };
        }
    }

    // Is the concept idenfitied by a property
    if (ast.idField) {
        if (ast.idField.name === '$identifier') {
            decl.identified = {
                $class: 'concerto.metamodel.Identified'
            };
        } else {
            decl.identified = {
                $class: 'concerto.metamodel.IdentifiedBy',
                name: ast.idField.name
            };
        }
    }

    // Handle decorators
    if (ast.decorators && ast.decorators.length > 0) {
        decl.decorators = decoratorsToMetaModel(ast.decorators);
    }

    // Concept properties
    decl.properties = [];
    for (let n = 0; n < ast.body.declarations.length; n++) {
        let thing = ast.body.declarations[n];
        // console.log(`THING ${JSON.stringify(thing)}`);
        if (thing.type === 'FieldDeclaration') {
            decl.properties.push(propertyToMetaModel(thing));
        } else if (thing.type === 'RelationshipDeclaration') {
            decl.properties.push(relationshipToMetaModel(thing));
        }
    }

    return decl;
}

/**
 * Create metamodel for a declaration
 * @param {object} ast - the AST for the declaration
 * @return {object} the metamodel for this declaration
 */
function declToMetaModel(ast) {
    if(ast.type === 'EnumDeclaration') {
        return enumDeclToMetaModel(ast);
    }
    return conceptDeclToMetaModel(ast);
}

/**
 * Export metamodel from an AST
 * @param {object} ast - the AST for the model
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model
 */
function modelToMetaModel(ast, validate = true) {
    const metamodel = {
        $class: 'concerto.metamodel.Model'
    };
    metamodel.namespace = ast.namespace;

    if(ast.imports) {
        metamodel.imports = [];
        ast.imports.forEach((imp) => {
            const split = imp.namespace.split('.');
            const name = split.pop();
            const namespace = split.join('.');
            if (namespace === 'concerto') {
                return;
            }
            const ns = { namespace };
            if (name === '*') {
                ns.$class = 'concerto.metamodel.ImportAll';
            } else {
                ns.$class = 'concerto.metamodel.ImportType';
                ns.name = name;
            }
            if(imp.uri) {
                ns.uri = imp.uri;
            }
            metamodel.imports.push(ns);
        });
    }

    if (ast.body.length > 0) {
        metamodel.declarations = [];
    }
    for(let n=0; n < ast.body.length; n++ ) {
        const thing = ast.body[n];
        const decl = declToMetaModel(thing);
        metamodel.declarations.push(decl);
    }

    // Last, validate the JSON metaModel
    const mm = validate ? validateMetaModel(metamodel) : metamodel;

    return mm;
}

/**
 * Export metamodel from a model file
 * @param {object} modelFile - the ModelFile
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model
 */
function modelFileToMetaModel(modelFile, validate) {
    return modelToMetaModel(modelFile.ast, validate);
}

/**
 * Export metamodel from a model manager
 * @param {object} modelManager - the ModelManager
 * @param {boolean} [resolve] - whether to resolve names
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model manager
 */
function modelManagerToMetaModel(modelManager, resolve, validate) {
    const result = {
        $class: 'concerto.metamodel.Models',
        models: [],
    };
    modelManager.getModelFiles().forEach((modelFile) => {
        let metaModel = modelToMetaModel(modelFile.ast, validate);
        if (resolve) {
            metaModel = resolveMetaModel(modelManager, metaModel);
        }
        result.models.push(metaModel);
    });
    return result;
}

/**
 * Create decorator argument string from a metamodel
 * @param {object} mm - the metamodel
 * @return {string} the string for the decorator argument
 */
function decoratorArgFromMetaModel(mm) {
    let result = '';
    switch (mm.$class) {
    case 'concerto.metamodel.DecoratorTypeReference':
        result += `${mm.type.name}${mm.isArray ? '[]' : ''}`;
        break;
    case 'concerto.metamodel.DecoratorString':
        result += `"${mm.value}"`;
        break;
    default:
        result += `${mm.value}`;
        break;
    }
    return result;
}

/**
 * Create decorator string from a metamodel
 * @param {object} mm - the metamodel
 * @return {string} the string for the decorator
 */
function decoratorFromMetaModel(mm) {
    let result = '';
    result += `@${mm.name}`;
    if (mm.arguments) {
        result += '(';
        result += mm.arguments.map(decoratorArgFromMetaModel).join(',');
        result += ')';
    }
    return result;
}

/**
 * Create decorators string from a metamodel
 * @param {object} mm - the metamodel
 * @param {string} prefix - indentation
 * @return {string} the string for the decorators
 */
function decoratorsFromMetaModel(mm, prefix) {
    let result = '';
    result += mm.map(decoratorFromMetaModel).join(`\n${prefix}`);
    result += `\n${prefix}`;
    return result;
}

/**
 * Create a property string from a metamodel
 * @param {object} mm - the metamodel
 * @return {string} the string for that property
 */
function propertyFromMetaModel(mm) {
    let result = '';
    let defaultString = '';
    let validatorString = '';

    if (mm.decorators) {
        result += decoratorsFromMetaModel(mm.decorators, '  ');
    }
    if (mm.$class === 'concerto.metamodel.RelationshipProperty') {
        result += '-->';
    } else {
        result += 'o';
    }

    switch (mm.$class) {
    case 'concerto.metamodel.EnumProperty':
        break;
    case 'concerto.metamodel.BooleanProperty':
        result += ' Boolean';
        if (mm.defaultValue === true || mm.defaultValue === false) {
            if (mm.defaultValue) {
                defaultString += ' default=true';
            } else {
                defaultString += ' default=false';
            }
        }
        break;
    case 'concerto.metamodel.DateTimeProperty':
        result += ' DateTime';
        break;
    case 'concerto.metamodel.DoubleProperty':
        result += ' Double';
        if (mm.defaultValue) {
            const doubleString = mm.defaultValue.toFixed(Math.max(1, (mm.defaultValue.toString().split('.')[1] || []).length));

            defaultString += ` default=${doubleString}`;
        }
        if (mm.validator) {
            const lowerString = mm.validator.lower ? mm.validator.lower : '';
            const upperString = mm.validator.upper ? mm.validator.upper : '';
            validatorString += ` range=[${lowerString},${upperString}]`;
        }
        break;
    case 'concerto.metamodel.IntegerProperty':
        result += ' Integer';
        if (mm.defaultValue) {
            defaultString += ` default=${mm.defaultValue.toString()}`;
        }
        if (mm.validator) {
            const lowerString = mm.validator.lower ? mm.validator.lower : '';
            const upperString = mm.validator.upper ? mm.validator.upper : '';
            validatorString += ` range=[${lowerString},${upperString}]`;
        }
        break;
    case 'concerto.metamodel.LongProperty':
        result += ' Long';
        if (mm.defaultValue) {
            defaultString += ` default=${mm.defaultValue.toString()}`;
        }
        if (mm.validator) {
            const lowerString = mm.validator.lower ? mm.validator.lower : '';
            const upperString = mm.validator.upper ? mm.validator.upper : '';
            validatorString += ` range=[${lowerString},${upperString}]`;
        }
        break;
    case 'concerto.metamodel.StringProperty':
        result += ' String';
        if (mm.defaultValue) {
            defaultString += ` default="${mm.defaultValue}"`;
        }
        if (mm.validator) {
            validatorString += ` regex=${mm.validator.regex}`;
        }
        break;
    case 'concerto.metamodel.ObjectProperty':
        result += ` ${mm.type.name}`;
        if (mm.defaultValue) {
            defaultString += ` default="${mm.defaultValue}"`;
        }
        break;
    case 'concerto.metamodel.RelationshipProperty':
        result += ` ${mm.type.name}`;
        break;
    }
    if (mm.isArray) {
        result += '[]';
    }
    result += ` ${mm.name}`;
    if (mm.isOptional) {
        result += ' optional';
    }
    result += defaultString;
    result += validatorString;
    return result;
}

/**
 * Create a declaration string from a metamodel
 * @param {object} mm - the metamodel
 * @return {string} the string for that declaration
 */
function declFromMetaModel(mm) {
    let result = '';
    if (mm.decorators) {
        result += decoratorsFromMetaModel(mm.decorators, '');
    }

    if (mm.isAbstract) {
        result += 'abstract ';
    }
    switch (mm.$class) {
    case 'concerto.metamodel.AssetDeclaration':
        result += `asset ${mm.name} `;
        break;
    case 'concerto.metamodel.ConceptDeclaration':
        result += `concept ${mm.name} `;
        break;
    case 'concerto.metamodel.EventDeclaration':
        result += `event ${mm.name} `;
        break;
    case 'concerto.metamodel.ParticipantDeclaration':
        result += `participant ${mm.name} `;
        break;
    case 'concerto.metamodel.TransactionDeclaration':
        result += `transaction ${mm.name} `;
        break;
    case 'concerto.metamodel.EnumDeclaration':
        result += `enum ${mm.name} `;
        break;
    }
    if (mm.superType) {
        result += `extends ${mm.superType.name} `;
    }
    // XXX Needs to be fixed to support `identified`
    if (mm.identified) {
        if (mm.identified.$class === 'concerto.metamodel.IdentifiedBy') {
            result += `identified by ${mm.identified.name} `;
        } else {
            result += 'identified ';
        }
    }
    result += '{';
    mm.properties.forEach((property) => {
        result += `\n  ${propertyFromMetaModel(property)}`;
    });
    result += '\n}';
    return result;
}

/**
 * Create a model string from a metamodel
 * @param {object} metaModel - the metamodel
 * @param {boolean} [validate] - whether to perform validation
 * @return {string} the string for that model
 */
function ctoFromMetaModel(metaModel, validate = true) {
    // First, validate the JSON metaModel
    const mm = validate ? validateMetaModel(metaModel) : metaModel;

    let result = '';
    result += `namespace ${mm.namespace}`;
    if (mm.imports && mm.imports.length > 0) {
        result += '\n';
        mm.imports.forEach((imp) => {
            let name = '*';
            if (imp.$class === 'concerto.metamodel.ImportType') {
                name = imp.name;
            }
            result += `\nimport ${imp.namespace}.${name}`;
            if (imp.uri) {
                result += ` from ${imp.uri}`;
            }
        });
    }
    if (mm.declarations && mm.declarations.length > 0) {
        mm.declarations.forEach((decl) => {
            result += `\n\n${declFromMetaModel(decl)}`;
        });
    }
    return result;
}

/**
 * Import metamodel to a model manager
 * @param {object} metaModel - the metamodel
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model manager
 */
function modelManagerFromMetaModel(metaModel, validate) {
    // First, validate the JSON metaModel
    const mm = validate ? validateMetaModel(metaModel) : metaModel;

    const modelManager = new ModelManager();

    mm.models.forEach((mm) => {
        const cto = ctoFromMetaModel(mm, false); // No need to re-validate
        modelManager.addModelFile(cto, null, false);
    });

    modelManager.validateModelFiles();
    return modelManager;
}

/**
 * Export metamodel from a model string
 * @param {string} model - the string for the model
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model
 */
function ctoToMetaModel(model, validate) {
    const ast = parser.parse(model);
    return modelToMetaModel(ast);
}

/**
 * Export metamodel from a model string and resolve names
 * @param {*} modelManager - the model manager
 * @param {string} model - the string for the model
 * @param {boolean} [validate] - whether to perform validation
 * @return {object} the metamodel for this model
 */
function ctoToMetaModelAndResolve(modelManager, model, validate) {
    const ast = parser.parse(model);
    const metaModel = modelToMetaModel(ast);
    const result = resolveMetaModel(modelManager, metaModel);
    return result;
}

module.exports = {
    metaModelCto,
    modelFileToMetaModel,
    modelManagerToMetaModel,
    modelManagerFromMetaModel,
    resolveMetaModel,
    ctoToMetaModel,
    ctoToMetaModelAndResolve,
    ctoFromMetaModel,
};