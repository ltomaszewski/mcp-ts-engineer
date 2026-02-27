# Better Auth Authorization

## Admin Plugin

The admin plugin provides user management capabilities: creating users, assigning roles, banning/unbanning, impersonation, and session management.

### Server Setup

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    admin({
      defaultRole: "user",                      // default role for new users
      adminRoles: ["admin"],                     // roles with admin privileges
      adminUserIds: [],                          // user IDs with admin access
      impersonationSessionDuration: 60 * 60,     // 1 hour (seconds)
      defaultBanReason: "Violation of terms",
      bannedUserMessage: "Your account has been suspended",
      allowImpersonatingAdmins: false,
    }),
  ],
});
```

### Client Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

Run migrations after adding the plugin:

```bash
npx @better-auth/cli migrate
```

The plugin adds `role`, `banned`, `banReason`, and `banExpires` fields to the user table, and `impersonatedBy` to the session table.

### Default Roles

| Role | Permissions |
|---|---|
| `admin` | Full control over user management and resources |
| `user` | No administrative permissions |

A user can have multiple roles (stored as comma-separated string).

### User Management

**Create User:**

```typescript
// Client
const { data, error } = await authClient.admin.createUser({
  email: "newuser@example.com",
  password: "securepassword",
  name: "Jane Smith",
  role: "user",                    // optional
  data: { customField: "value" },  // optional
});

// Server
const newUser = await auth.api.createUser({
  body: {
    email: "newuser@example.com",
    password: "securepassword",
    name: "Jane Smith",
    role: "user",
  },
});
```

**List Users (with search, filter, pagination):**

```typescript
// Client
const { data, error } = await authClient.admin.listUsers({
  searchValue: "john",
  searchField: "name",              // "email" | "name"
  searchOperator: "contains",       // "contains" | "starts_with" | "ends_with"
  limit: 10,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc",
  filterField: "role",
  filterValue: "admin",
  filterOperator: "eq",             // "eq" | "ne" | "lt" | "lte" | "gt" | "gte"
});
// data.users, data.total, data.limit, data.offset

// Pagination
const pageSize = 10;
const currentPage = 2;
const result = await authClient.admin.listUsers({
  limit: pageSize,
  offset: (currentPage - 1) * pageSize,
});
const totalPages = Math.ceil(result.data.total / pageSize);
```

**Update User:**

```typescript
// Client
const { data, error } = await authClient.admin.updateUser({
  userId: "user-id",
  data: { name: "Updated Name" },
});

// Server
await auth.api.adminUpdateUser({
  body: { userId: "user-id", data: { name: "Updated Name" } },
  headers: await headers(),
});
```

**Remove User:**

```typescript
// Client
await authClient.admin.removeUser({ userId: "user-id" });

// Server
await auth.api.removeUser({
  body: { userId: "user-id" },
  headers: await headers(),
});
```

### Role Assignment

```typescript
// Client
await authClient.admin.setRole({
  userId: "user-id",
  role: "admin",                   // or ["admin", "moderator"]
});

// Server
await auth.api.setRole({
  body: { userId: "user-id", role: "admin" },
  headers: await headers(),
});
```

### Set User Password

```typescript
// Client
await authClient.admin.setUserPassword({
  userId: "user-id",
  newPassword: "newSecurePassword",
});

// Server
await auth.api.setUserPassword({
  body: { userId: "user-id", newPassword: "newSecurePassword" },
  headers: await headers(),
});
```

### Ban / Unban Users

```typescript
// Ban user
await authClient.admin.banUser({
  userId: "user-id",
  banReason: "Spamming",                // optional
  banExpiresIn: 60 * 60 * 24 * 7,      // optional: 7 days in seconds
});

// Unban user
await authClient.admin.unbanUser({
  userId: "user-id",
});
```

Banning a user revokes all their active sessions immediately.

### Session Management

```typescript
// List user sessions
const { data } = await authClient.admin.listUserSessions({
  userId: "user-id",
});

// Revoke specific session
await authClient.admin.revokeUserSession({
  sessionToken: "session-token",
});

// Revoke all sessions for user
await authClient.admin.revokeUserSessions({
  userId: "user-id",
});
```

### Impersonation

```typescript
// Start impersonating
await authClient.admin.impersonateUser({
  userId: "user-id",
});
// Creates a temporary session (default 1 hour) as that user

// Stop impersonating (return to admin account)
await authClient.admin.stopImpersonating({});
```

Impersonation sessions expire after the configured `impersonationSessionDuration` or when the browser session ends.

---

## Access Control System

Better Auth uses a declarative RBAC system built on `createAccessControl`. The same access control definitions are shared between server and client for consistent permission checking.

### Define Permissions

```typescript
// lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";

// Define entities and their allowed actions
const statement = {
  project: ["create", "read", "update", "delete", "share"],
  sale: ["create", "read", "update", "delete"],
  report: ["view", "export"],
} as const;

// Create the access control instance
const ac = createAccessControl(statement);

// Define roles with their permissions
export const member = ac.newRole({
  project: ["create", "read"],
  sale: ["read"],
  report: ["view"],
});

export const admin = ac.newRole({
  project: ["create", "read", "update", "delete"],
  sale: ["create", "read", "update"],
  report: ["view", "export"],
});

export const owner = ac.newRole({
  project: ["create", "read", "update", "delete", "share"],
  sale: ["create", "read", "update", "delete"],
  report: ["view", "export"],
});

export { ac };
```

### Extend Default Admin Permissions

When using the admin plugin, merge with its default statements:

```typescript
// lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  project: ["create", "read", "update", "delete", "share"],
  sale: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

export const admin = ac.newRole({
  project: ["create", "read", "update", "delete"],
  sale: ["create", "read", "update"],
  ...adminAc.statements, // includes default admin permissions
});

export const user = ac.newRole({
  project: ["create", "read"],
  sale: ["read"],
});

export { ac };
```

### Register with Admin Plugin

**Server:**

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { ac, admin as adminRole, user as userRole } from "@/lib/permissions";

export const auth = betterAuth({
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
      },
    }),
  ],
});
```

**Client:**

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin as adminRole, user as userRole } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
      },
    }),
  ],
});
```

### Check Permissions

**Server-side:**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Check current user's permissions
const canCreate = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      project: ["create"],
    },
  },
});
// canCreate.data.success === true | false

// Check specific user or role
const canDelete = await auth.api.userHasPermission({
  body: {
    userId: "user-id",       // check by user ID
    // or: role: "admin",    // check by role
    permissions: {
      project: ["delete"],
    },
  },
});
```

**Client-side:**

```typescript
import { authClient } from "@/lib/auth-client";

// Check current user (API call)
const canCreate = await authClient.admin.hasPermission({
  permissions: {
    project: ["create"],
  },
});

// Local role check (no API call, instant)
const adminCanDelete = authClient.admin.checkRolePermission({
  role: "admin",
  permissions: {
    project: ["delete"],
  },
});
```

### Protecting Routes with Permissions

```typescript
// app/admin/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const hasAccess = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        project: ["delete"],
      },
    },
  });

  if (!hasAccess.success) {
    redirect("/unauthorized");
  }

  return <h1>Admin Dashboard</h1>;
}
```

---

## Organization Plugin

The organization plugin enables multi-tenancy with teams, roles, invitations, and fine-grained permissions per organization.

### Server Setup

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      allowUserToCreateOrganization: true,    // or async (user) => boolean
      organizationLimit: 5,                    // max orgs per user
      creatorRole: "owner",                    // "owner" | "admin"
      membershipLimit: 100,                    // max members per org
      invitationExpiresIn: 172800,             // 48 hours (seconds)
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invite/${data.id}`;
        await sendEmail({
          email: data.email,
          subject: `Join ${data.organization.name}`,
          text: `You've been invited by ${data.inviter.user.name}. Accept: ${inviteLink}`,
        });
      },
    }),
  ],
});
```

### Client Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
```

Run migrations:

```bash
npx @better-auth/cli migrate
```

### Default Organization Roles

| Role | Permissions |
|---|---|
| `owner` | Full control, including deleting org and changing ownership |
| `admin` | Full control except org deletion and ownership transfer |
| `member` | Read-only access |

### Organization Management

**Create Organization:**

```typescript
// Client
const { data, error } = await authClient.organization.create({
  name: "My Organization",
  slug: "my-org",
  logo: "https://example.com/logo.png",  // optional
});

// Server
const org = await auth.api.createOrganization({
  body: { name: "My Organization", slug: "my-org" },
  headers: await headers(),
});
```

**List User Organizations:**

```typescript
// React hook
const { data: organizations } = authClient.useListOrganizations();

// Direct call
const { data } = await authClient.organization.list({});
```

**Set Active Organization:**

```typescript
// Client
await authClient.organization.setActive({
  organizationId: "org-id",
  // or: organizationSlug: "my-org",
});

// React hook for active org
const { data: activeOrg } = authClient.useActiveOrganization();
```

**Update Organization:**

```typescript
await authClient.organization.update({
  data: {
    name: "Updated Name",
    slug: "updated-slug",
    logo: "https://example.com/new-logo.png",
  },
});
```

**Delete Organization:**

```typescript
await authClient.organization.delete({
  organizationId: "org-id",
});
```

### Invitations

**Invite Member:**

```typescript
// Client
await authClient.organization.inviteMember({
  email: "newmember@example.com",
  role: "member",            // "owner" | "admin" | "member" or custom
  organizationId: "org-id",  // optional if active org is set
});
```

**Accept / Reject / Cancel Invitation:**

```typescript
// Accept
await authClient.organization.acceptInvitation({
  invitationId: "invitation-id",
});

// Reject
await authClient.organization.rejectInvitation({
  invitationId: "invitation-id",
});

// Cancel (by inviter/admin)
await authClient.organization.cancelInvitation({
  invitationId: "invitation-id",
});
```

**List Invitations:**

```typescript
// Org invitations
const { data } = await authClient.organization.listInvitations({});

// Current user's pending invitations
const invitations = await authClient.organization.listUserInvitations();
```

### Member Management

**List Members:**

```typescript
const { data } = await authClient.organization.listMembers({
  organizationId: "org-id",  // optional
  limit: 100,
  offset: 0,
  sortBy: "createdAt",
  sortDirection: "desc",
});
```

**Update Member Role:**

```typescript
await authClient.organization.updateMemberRole({
  memberId: "member-id",
  role: "admin",
});
```

**Remove Member:**

```typescript
await authClient.organization.removeMember({
  memberIdOrEmail: "member@example.com",
});
```

**Leave Organization:**

```typescript
await authClient.organization.leave({
  organizationId: "org-id",
});
```

**Get Active Member Info:**

```typescript
const { data: member } = await authClient.organization.getActiveMember({});
const { data: role } = await authClient.organization.getActiveMemberRole({});
```

### Custom Roles & Permissions for Organizations

```typescript
// lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  project: ["create", "read", "update", "delete", "share"],
  billing: ["view", "manage"],
} as const;

const ac = createAccessControl(statement);

export const member = ac.newRole({
  project: ["create", "read"],
});

export const admin = ac.newRole({
  project: ["create", "read", "update", "delete"],
  billing: ["view"],
  ...adminAc.statements,
});

export const owner = ac.newRole({
  project: ["create", "read", "update", "delete", "share"],
  billing: ["view", "manage"],
  ...adminAc.statements,
});

export { ac };
```

**Register with Organization Plugin:**

```typescript
// Server
import { organization } from "better-auth/plugins";
import { ac, owner, admin, member } from "@/lib/permissions";

export const auth = betterAuth({
  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },
    }),
  ],
});
```

```typescript
// Client
import { organizationClient } from "better-auth/client/plugins";
import { ac, owner, admin, member } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
  ],
});
```

### Check Organization Permissions

**Server-side:**

```typescript
const canCreate = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      project: ["create"],
    },
  },
});
```

**Client-side:**

```typescript
// API call
const canCreate = await authClient.organization.hasPermission({
  permissions: {
    project: ["create"],
  },
});

// Local check (no API call)
const adminCanDelete = authClient.organization.checkRolePermission({
  role: "admin",
  permissions: {
    project: ["delete"],
  },
});
```

### Teams (Sub-Groups within Organizations)

Enable teams for finer-grained grouping:

**Server:**

```typescript
export const auth = betterAuth({
  plugins: [
    organization({
      teams: {
        enabled: true,
        maximumTeams: 10,             // per org
        maximumMembersPerTeam: 50,    // per team
        allowRemovingAllTeams: false,
      },
    }),
  ],
});
```

**Client:**

```typescript
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      teams: { enabled: true },
    }),
  ],
});
```

**Team Operations:**

```typescript
// Create team
await authClient.organization.createTeam({
  name: "Engineering",
  organizationId: "org-id",
});

// List teams
const { data } = await authClient.organization.listTeams({});

// Set active team
await authClient.organization.setActiveTeam({ teamId: "team-id" });

// Add member to team
await authClient.organization.addTeamMember({
  teamId: "team-id",
  userId: "user-id",
});

// Remove from team
await authClient.organization.removeTeamMember({
  teamId: "team-id",
  userId: "user-id",
});

// List team members
const { data: members } = await authClient.organization.listTeamMembers({
  teamId: "team-id",
});

// Remove team
await authClient.organization.removeTeam({ teamId: "team-id" });
```

### Dynamic Access Control (Runtime Roles)

Enable creating custom roles at runtime per organization:

```typescript
// Server
organization({
  ac,
  dynamicAccessControl: {
    enabled: true,
    maximumRolesPerOrganization: 10,
  },
});
```

```typescript
// Create role at runtime
await authClient.organization.createRole({
  role: "reviewer",
  permission: { project: ["read", "update"] },
});

// List dynamic roles
const { data: roles } = await authClient.organization.listRoles({});

// Update role permissions
await authClient.organization.updateRole({
  roleId: "role-id",
  data: {
    permission: { project: ["read", "update", "delete"] },
  },
});

// Delete role
await authClient.organization.deleteRole({ roleId: "role-id" });
```

---

## Organization Hooks

Execute custom logic during organization lifecycle events:

```typescript
export const auth = betterAuth({
  plugins: [
    organization({
      organizationHooks: {
        // Organization lifecycle
        beforeCreateOrganization: async ({ organization, user }) => {
          return {
            data: { ...organization, metadata: { plan: "free" } },
          };
        },
        afterCreateOrganization: async ({ organization, member, user }) => {
          await setupDefaultResources(organization.id);
        },
        beforeDeleteOrganization: async ({ organization, user, member }) => {
          // validation or cleanup
        },

        // Member lifecycle
        beforeAddMember: async ({ member, user, organization }) => {
          return { data: { ...member, role: "custom-role" } };
        },
        afterAddMember: async ({ member, user, organization }) => {
          await sendWelcomeEmail(user.email, organization.name);
        },
        afterUpdateMemberRole: async ({ member, previousRole, user, organization }) => {
          await logRoleChange(user.id, previousRole, member.role);
        },

        // Invitation lifecycle
        beforeCreateInvitation: async ({ invitation, inviter, organization }) => {
          return {
            data: {
              ...invitation,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          };
        },
        afterAcceptInvitation: async ({ invitation, member, user, organization }) => {
          await setupNewMemberResources(user, organization);
        },
      },
    }),
  ],
});
```

### Hook Error Handling

```typescript
import { APIError } from "better-auth/api";

organizationHooks: {
  beforeAddMember: async ({ member, user, organization }) => {
    const violations = await checkUserViolations(user.id);
    if (violations.length > 0) {
      throw new APIError("BAD_REQUEST", {
        message: "User has pending violations",
      });
    }
  },
},
```

---

## Custom Schema Fields for Organizations

```typescript
organization({
  schema: {
    organization: {
      modelName: "organizations",
      fields: { name: "title" },
      additionalFields: {
        plan: {
          type: "string",
          input: true,
          required: false,
        },
      },
    },
  },
}),
```

Client-side type inference for additional fields:

```typescript
import { inferOrgAdditionalFields, organizationClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
  ],
});

// Now typed: await authClient.organization.create({ name: "Org", slug: "org", plan: "pro" })
```

---

## Middleware Patterns for Authorization

### Role-Based Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Optimistic check: redirect to sign-in if no cookie
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
```

### Server-Side Role Validation (In Route Handler)

```typescript
// app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check admin role
  if (!session.user.role?.includes("admin")) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
```

### Permission-Based Route Protection

```typescript
// app/projects/new/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CreateProjectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const canCreate = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: { project: ["create"] },
    },
  });

  if (!canCreate.success) {
    redirect("/unauthorized");
  }

  return <CreateProjectForm />;
}
```

### Client-Side Permission Guard Component

```typescript
"use client";
import { authClient } from "@/lib/auth-client";
import { ReactNode } from "react";

interface PermissionGateProps {
  permissions: Record<string, string[]>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permissions,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = authClient.useSession();

  if (!session) return fallback;

  // Use local role check for instant UI decisions
  const hasPermission = authClient.admin.checkRolePermission({
    role: session.user.role ?? "user",
    permissions,
  });

  if (!hasPermission) return fallback;

  return <>{children}</>;
}

// Usage
<PermissionGate
  permissions={{ project: ["delete"] }}
  fallback={<span>No access</span>}
>
  <DeleteProjectButton />
</PermissionGate>
```

**Version:** 1.4.x | **Source:** https://www.better-auth.com/docs
