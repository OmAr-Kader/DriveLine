import mongoose from 'mongoose';


/**
 * Create a new session AND first message atomically.
 * Body: { title: string; text: string; isUser: boolean }
 * Returns: { session, message }
 */
export async function supportsTransactions(): Promise<boolean> {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            process.env.DEBUG === 'true' && console.warn("MongoDB connection not ready yet. Assuming standalone mode.");
            return false;
        }

        const admin = db.admin();
        const info = await admin.command({ isMaster: 1 });
        return !!info.setName; // true if part of a replica set
    } catch (err) {
        process.env.DEBUG === 'true' && console.warn("Failed to detect replica set, assuming standalone:", err);
        return false;
    }
}

export function trimLastMessage(text: string, maxLength = 100): string {
    if (text.length <= maxLength) return text;

    // Take the first maxLength characters
    let truncated = text.slice(0, maxLength);

    // Remove partial last word
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
        truncated = truncated.slice(0, lastSpace);
    }

    return truncated;
}