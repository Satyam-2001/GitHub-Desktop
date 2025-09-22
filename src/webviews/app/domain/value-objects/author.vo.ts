export class Author {
  constructor(
    public readonly name: string,
    public readonly email: string,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error("Author name cannot be empty");
    }
    if (!email || !this.isValidEmail(email)) {
      throw new Error("Invalid email address");
    }
  }

  get initials(): string {
    return this.name
      .split(" ")
      .map((part) => (part || "").charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }

  get displayName(): string {
    return this.name;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: Author): boolean {
    return this.name === other.name && this.email === other.email;
  }

  toString(): string {
    return `${this.name} <${this.email}>`;
  }
}
