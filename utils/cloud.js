const db = () => wx.cloud.database();

async function getProfile() {
  const result = await db().collection("profiles").limit(1).get();
  return result.data[0] || null;
}

async function saveProfile(profile) {
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

function pickProfileData(profile) {
  return {
    nickname: profile.nickname || "Sweet.log",
    avatarUrl: profile.avatarUrl || "",
    isPregnant: !!profile.isPregnant,
    dueDate: profile.dueDate || "",
    thresholdPreset: profile.thresholdPreset || (profile.isPregnant ? "pregnancy" : "non_pregnancy")
  };
}

async function getThresholdRules() {
  const result = await db().collection("threshold_rules").get();
  return result.data;
}

async function replaceThresholdRules(rules) {
  const current = await getThresholdRules();

  await Promise.all(
    current
      .filter((rule) => rule._id)
      .map((rule) => db().collection("threshold_rules").doc(rule._id).remove())
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

async function addGlucoseRecord(record) {
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

async function updateGlucoseRecord(recordId, record) {
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

async function deleteGlucoseRecord(recordId) {
  await db().collection("glucose_records").doc(recordId).remove();
}

async function listGlucoseRecords(limit = 100) {
  const result = await db()
    .collection("glucose_records")
    .orderBy("measuredAt", "desc")
    .limit(limit)
    .get();

  return result.data;
}

async function getLatestGlucoseRecord() {
  const records = await listGlucoseRecords(1);
  return records[0] || null;
}

async function getLatestGlucoseRecordByTag(tag) {
  const result = await db()
    .collection("glucose_records")
    .where({ tag })
    .orderBy("measuredAt", "desc")
    .limit(1)
    .get();

  return result.data[0] || null;
}

async function getGlucoseRecordByTagBetween(tag, start, end) {
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

  return result.data.find((record) => record.measuredAt <= endISOString) || null;
}

async function listGlucoseRecordsByTagSince(tag, since, limit = 100) {
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

  return result.data;
}

module.exports = {
  getProfile,
  saveProfile,
  getThresholdRules,
  replaceThresholdRules,
  addGlucoseRecord,
  updateGlucoseRecord,
  deleteGlucoseRecord,
  listGlucoseRecords,
  getLatestGlucoseRecord,
  getLatestGlucoseRecordByTag,
  getGlucoseRecordByTagBetween,
  listGlucoseRecordsByTagSince
};
