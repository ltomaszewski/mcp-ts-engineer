/**
 * NestJS-specific audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const NESTJS_RULES = `
### NestJS
| Rule | Detection | Confidence | Fix | Skip If |
|------|-----------|------------|-----|---------|
| Missing @UseGuards | @Controller without @UseGuards on class or methods | High | Add @UseGuards(AuthGuard) decorator | Public endpoint (health, docs) |
| Missing validators | @Body()/@Query() without class-validator decorators on DTO | High | Add @IsString(), @IsEmail(), etc. to DTO properties | Primitive params with @Param() pipe |
| Module encapsulation | Service used outside its module without being in exports[] | High | Add service to module exports array | Shared/global module |
| Missing @Injectable | Class used in providers[] without @Injectable() decorator | High | Add @Injectable() decorator to class | Plain value provider with useValue |
| Direct DB in controller | Controller method contains .find(), .save(), .delete() calls | Medium | Move DB access to service layer | Simple CRUD with no business logic |
| Missing exception filter | throw new Error() instead of NestJS HttpException subclass | Medium | Replace with BadRequestException, NotFoundException, etc. | Internal helper not in request path |
| Unhandled async in resolver | @ResolveField() or @Query() without try/catch or error filter | Medium | Add try/catch with appropriate GraphQL error | Global exception filter already registered |
| Missing ValidationPipe | @Body() used without ValidationPipe at method, controller, or global level | Medium | Add @UsePipes(ValidationPipe) or register globally | Global pipe in main.ts bootstrap |
| Raw query construction | String concatenation or template literal in .aggregate() / .find() | High | Use parameterized query or query builder | Static query with no user input |
| Missing transaction | Multiple .save()/.create() calls in one method without session/transaction | Low | Wrap in withTransaction() or startSession() | Read-only operations |
`.trim()
