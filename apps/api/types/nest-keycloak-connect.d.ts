// nest-keycloak-connect 1.x importa sus tipos desde '@nestjs/common/interfaces',
// una ruta que el exports map de Nest 12 ya no expone. Sin esto ModuleMetadata
// se resuelve como any y, por ejemplo, `imports` pasa a ser obligatorio en
// KeycloakConnectModule.registerAsync. En runtime solo usa '@nestjs/common'.
declare module '@nestjs/common/interfaces' {
    export * from '@nestjs/common';
}
