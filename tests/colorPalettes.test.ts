import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COLOR_HUNT_FIELD_PRESETS,
  COLOR_HUNT_SOURCE_AVERAGE_LIKES,
  applyColorPresetToField,
  createRandomColorHuntFieldStyle,
  findMatchingColorHuntPreset,
  getRandomColorHuntPreset,
  oklabDistance,
  relativeLuminance,
} from '../src/colorPalettes.ts';

function averageNearestBackgroundDistance(): number {
  const distances = COLOR_HUNT_FIELD_PRESETS.slice(1).map((preset, index) => {
    const previousPresets = COLOR_HUNT_FIELD_PRESETS.slice(0, index + 1);
    return Math.min(
      ...previousPresets.map(previous =>
        oklabDistance(preset.backgroundColor, previous.backgroundColor)
      )
    );
  });

  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}

test('includes 20 high-liked Color Hunt presets with non-dark backgrounds', () => {
  assert.equal(COLOR_HUNT_FIELD_PRESETS.length, 20);

  for (const preset of COLOR_HUNT_FIELD_PRESETS) {
    assert.ok(
      preset.likes >= COLOR_HUNT_SOURCE_AVERAGE_LIKES,
      `${preset.name} should be above the Color Hunt average likes`
    );
    assert.ok(
      relativeLuminance(preset.backgroundColor) >= 0.48,
      `${preset.name} background should not be too dark`
    );
  }
});

test('selected backgrounds are visually separated enough for field labels', () => {
  assert.ok(
    averageNearestBackgroundDistance() >= 0.085,
    'Color Hunt backgrounds should be more distinct than the previous pastel-heavy set'
  );
});

test('random preset selection is deterministic when a random source is provided', () => {
  assert.equal(getRandomColorHuntPreset(() => 0).id, COLOR_HUNT_FIELD_PRESETS[0]!.id);
  assert.equal(getRandomColorHuntPreset(() => 0.999).id, COLOR_HUNT_FIELD_PRESETS[19]!.id);
});

test('applying a preset keeps field identity and synchronizes foreground colors', () => {
  const preset = COLOR_HUNT_FIELD_PRESETS[0]!;
  const field = createRandomColorHuntFieldStyle('新领域', () => 0);
  const updated = applyColorPresetToField({ ...field, name: '保留名称' }, preset);

  assert.equal(updated.name, '保留名称');
  assert.equal(updated.backgroundColor, preset.backgroundColor);
  assert.equal(updated.textColor, preset.textColor);
  assert.equal(updated.titleTextColor, preset.textColor);
  assert.equal(updated.metaTextColor, preset.textColor);
  assert.equal(updated.borderColor, preset.borderColor);
  assert.equal(updated.patternColor, preset.patternColor);
});

test('finds the selected preset from a field style after it is applied', () => {
  const preset = COLOR_HUNT_FIELD_PRESETS[3]!;
  const field = applyColorPresetToField(createRandomColorHuntFieldStyle('设计系统', () => 0), preset);

  assert.equal(findMatchingColorHuntPreset(field)?.id, preset.id);
});
