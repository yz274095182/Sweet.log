import { GlucoseRecord, GlucoseTagKey, Profile, ThresholdRule } from "../types/index";

const db = () => wx.cloud.database();

export async function getProfile(): Promise<Profile | null> {
  const result = await db().collection("profiles").limit(1).get();
  return (result.data[0] as Profile) || null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const now = new Date();
  const profileData = pickProfileData(profile);

  if (profile._id) {
    await db()
      .collection("profiles")
      .doc(profile._id)
      .update({
        data: {
          ...profileData,
          updatedAt: now
        }
      });
    return;
  }

  await db()
    .collection("profiles")
    .add({
      data: {
        ...profileData,
        createdAt: now,
        updatedAt: now
      }
    });
}

function pickProfileData(profile: Profile) {
  return {
    nickname: profile.nickname || "Sweet.log",
    avatarUrl: profile.avatarUrl || "",
    isPregnant: !!profile.isPregnant,
    dueDate: profile.dueDate || "",
    thresholdPreset: profile.thresholdPreset || (profile.isPregnant ? "pregnancy" : "non_pregnancy")
  };
}

export async function getThresholdRules(): Promise<ThresholdRule[]> {
  const result = await db().collection("threshold_rules").get();
  return result.data as ThresholdRule[];
}

export async function replaceThresholdRules(rules: ThresholdRule[]): Promise<void> {
  const current = await getThresholdRules();

  await Promise.all(
    current
      .filter((rule) => rule._id)
      .map((rule) => db().collection("threshold_rules").doc(rule._id as string).remove())
  );

  const now = new Date();
  await Promise.all(
    rules.map((rule) =>
      db()
        .collection("threshold_rules")
        .add({
          data: {
            tag: rule.tag,
            min: rule.min,
            max: rule.max,
            enabled: rule.enabled,
            createdAt: now,
            updatedAt: now
          }
        })
    )
  );
}

export async function addGlucoseRecord(record: GlucoseRecord): Promise<void> {
  const now = new Date();

  await db()
    .collection("glucose_records")
    .add({
      data: {
        ...record,
        createdAt: now,
        updatedAt: now
      }
    });
}

export async function updateGlucoseRecord(recordId: string, record: GlucoseRecord): Promise<void> {
  await db()
    .collection("glucose_records")
    .doc(recordId)
    .update({
      data: {
        measuredAt: record.measuredAt,
        tag: record.tag,
        value: record.value,
        unit: record.unit,
        status: record.status,
        note: record.note,
        contextTags: record.contextTags || [],
        thresholdMin: record.thresholdMin,
        thresholdMax: record.thresholdMax,
        updatedAt: new Date()
      }
    });
}

export async function deleteGlucoseRecord(recordId: string): Promise<void> {
  await db().collection("glucose_records").doc(recordId).remove();
}

export async function listGlucoseRecords(limit = 100): Promise<GlucoseRecord[]> {
  const result = await db()
    .collection("glucose_records")
    .orderBy("measuredAt", "desc")
    .limit(limit)
    .get();

  return result.data as GlucoseRecord[];
}

export async function getLatestGlucoseRecord(): Promise<GlucoseRecord | null> {
  const records = await listGlucoseRecords(1);
  return records[0] || null;
}

export async function getLatestGlucoseRecordByTag(
  tag: GlucoseTagKey
): Promise<GlucoseRecord | null> {
  const result = await db()
    .collection("glucose_records")
    .where({ tag })
    .orderBy("measuredAt", "desc")
    .limit(1)
    .get();

  return (result.data[0] as GlucoseRecord) || null;
}

export async function getGlucoseRecordByTagBetween(
  tag: GlucoseTagKey,
  start: Date,
  end: Date
): Promise<GlucoseRecord | null> {
  const command = db().command;
  const endISOString = end.toISOString();
  const result = await db()
    .collection("glucose_records")
    .where({
      tag,
      measuredAt: command.gte(start.toISOString())
    })
    .orderBy("measuredAt", "desc")
    .limit(20)
    .get();

  return (result.data as GlucoseRecord[]).find((record) => record.measuredAt <= endISOString) || null;
}

export async function listGlucoseRecordsByTagSince(
  tag: GlucoseTagKey,
  since: Date,
  limit = 100
): Promise<GlucoseRecord[]> {
  const command = db().command;
  const result = await db()
    .collection("glucose_records")
    .where({
      tag,
      measuredAt: command.gte(since.toISOString())
    })
    .orderBy("measuredAt", "desc")
    .limit(limit)
    .get();

  return result.data as GlucoseRecord[];
}
