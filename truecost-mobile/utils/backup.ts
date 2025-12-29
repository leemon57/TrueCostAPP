// Use legacy API to keep copy/delete helpers (new File/Directory API available if refactoring)
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { expoDb } from '@/db/client';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const DB_NAME = 'truecost.db';

export const backupData = async () => {
  try {
    // 1. Checkpoint WAL to ensure all data is in the main .db file
    // @ts-ignore
    await db.run(sql`PRAGMA wal_checkpoint(FULL)`);

    // 2. Locate the database file
    // Expo SQLite stores files in `${FileSystem.documentDirectory}SQLite/`
    const dbUri = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    
    // 3. Define a temporary backup path
    const backupUri = `${FileSystem.documentDirectory}${DB_NAME}`;

    // 4. Copy to temp location (Sharing often fails directly from internal SQLite folder)
    await FileSystem.copyAsync({
      from: dbUri,
      to: backupUri,
    });

    // 5. Share the file (User picks Drive, iCloud, or Save to Files)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupUri, {
        dialogTitle: 'Backup your Data',
        UTI: 'public.database', // iOS type
        mimeType: 'application/x-sqlite3', // Android type
      });
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }

    // 6. Clean up temp file
    await FileSystem.deleteAsync(backupUri, { idempotent: true });

  } catch (error) {
    console.error(error);
    Alert.alert("Backup Failed", "Could not create backup file.");
  }
};

export const restoreData = async () => {
  try {
    // 1. Pick the file
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/x-sqlite3', 'application/octet-stream', 'application/sql', '*/*'], 
    });

    if (result.canceled) return;

    const { uri } = result.assets[0];

    // 2. Confirm overwrite
    Alert.alert(
      "Restore Data",
      "This will overwrite all current app data. This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Restore", 
          style: "destructive",
          onPress: async () => {
             await performRestore(uri);
          }
        }
      ]
    );

  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to pick file.");
  }
};

const performRestore = async (sourceUri: string) => {
  try {
    // 3. Close the existing DB connection to prevent lock errors
    expoDb.closeSync();

    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const dbUri = `${dbDir}${DB_NAME}`;
    
    // 4. Delete existing DB files (including WAL/SHM to prevent corruption)
    await FileSystem.deleteAsync(dbUri, { idempotent: true });
    await FileSystem.deleteAsync(`${dbUri}-wal`, { idempotent: true });
    await FileSystem.deleteAsync(`${dbUri}-shm`, { idempotent: true });

    // 5. Copy new file to SQLite folder
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: dbUri,
    });

    // 6. Alert user to restart
    Alert.alert(
      "Restore Successful", 
      "Data restored successfully. Please force close and restart the app to reload the data.",
      [{ text: "OK" }]
    );

  } catch (e) {
    console.error(e);
    Alert.alert("Restore Failed", "Could not replace database file. Please reinstall the app if it is broken.");
  }
};
