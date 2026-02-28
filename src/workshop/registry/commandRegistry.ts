/**
 * Command Registry — Self-registering command manifest system
 *
 * Commands register themselves by calling commandRegistry.register()
 * at module scope. The registry auto-discovers all *.cmd.ts files
 * in the commands/ directory at startup.
 *
 * Usage:
 *   // In a command file (e.g., sharpen-claim.cmd.ts):
 *   import { commandRegistry } from '../registry/commandRegistry';
 *   commandRegistry.register({ id: 'sharpen_claim', ... });
 *
 *   // To query:
 *   const cmd = commandRegistry.getCommand('sharpen_claim');
 *   const analyticalCmds = commandRegistry.listByFamily('analytical');
 */

import { CommandManifest, CommandFamily, WorkshopEssayType } from '../shared/types';

class CommandRegistry {
  private commands = new Map<string, CommandManifest>();
  private initialized = false;

  /**
   * Register a command manifest. Throws on duplicate ID.
   */
  register(manifest: CommandManifest): void {
    if (this.commands.has(manifest.id)) {
      throw new Error(
        `[CommandRegistry] Duplicate command ID: '${manifest.id}'. Each command must have a unique ID.`
      );
    }
    this.commands.set(manifest.id, manifest);
  }

  /**
   * Get a command by ID.
   */
  getCommand(id: string): CommandManifest | undefined {
    return this.commands.get(id);
  }

  /**
   * List all commands in a given family.
   */
  listByFamily(family: CommandFamily): CommandManifest[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.family === family);
  }

  /**
   * List all commands applicable to a given essay type.
   */
  listByEssayType(essayType: WorkshopEssayType): CommandManifest[] {
    return Array.from(this.commands.values()).filter(cmd =>
      cmd.applicableEssayTypes.includes(essayType)
    );
  }

  /**
   * List all commands matching a given tier.
   */
  listByTier(tier: 1 | 2): CommandManifest[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.tier === tier);
  }

  /**
   * Get all registered commands.
   */
  getAll(): CommandManifest[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get count of registered commands.
   */
  get size(): number {
    return this.commands.size;
  }

  /**
   * Auto-import all command files from the commands/ directory.
   * Called once at startup. Safe to call multiple times (idempotent).
   */
  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const commandsDir = path.join(__dirname, '..', 'commands');

      if (!fs.existsSync(commandsDir)) return;

      const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.cmd.ts') || f.endsWith('.cmd.js'));

      for (const file of files) {
        try {
          await import(path.join(commandsDir, file));
        } catch (err) {
          console.error(`[CommandRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[CommandRegistry] Auto-import failed:', err);
    }
  }

  /**
   * Clear all registrations (for testing).
   */
  _reset(): void {
    this.commands.clear();
    this.initialized = false;
  }
}

/** Singleton command registry */
export const commandRegistry = new CommandRegistry();
