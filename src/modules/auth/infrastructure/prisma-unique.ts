import { Prisma } from '../../../generated/prisma/client';

export function prismaUniqueTargetIncludes(
  error: Prisma.PrismaClientKnownRequestError,
  field: string,
): boolean {
  const target = error.meta?.target;
  const values = Array.isArray(target) ? target : [target];
  return values.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(field),
  );
}
