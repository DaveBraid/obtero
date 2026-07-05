import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HAPPY_HUES_FIELD_PRESETS,
  applyColorPresetToField,
  createRandomHappyHuesFieldStyle,
  findMatchingHappyHuesPreset,
  getRandomHappyHuesPreset,
  relativeLuminance,
} from '../src/colorPalettes.ts';

test('includes all 17 Happy Hues palettes with light card backgrounds', () => {
  assert.equal(HAPPY_HUES_FIELD_PRESETS.length, 17);

  for (const preset of HAPPY_HUES_FIELD_PRESETS) {
    assert.ok(
      relativeLuminance(preset.backgroundColor) >= 0.65,
      `${preset.name} background should not be too dark`
    );
  }
});

test('random preset selection is deterministic when a random source is provided', () => {
  assert.equal(getRandomHappyHuesPreset(() => 0).id, HAPPY_HUES_FIELD_PRESETS[0]!.id);
  assert.equal(getRandomHappyHuesPreset(() => 0.999).id, HAPPY_HUES_FIELD_PRESETS[16]!.id);
});

test('applying a preset keeps field identity and synchronizes foreground colors', () => {
  const preset = HAPPY_HUES_FIELD_PRESETS[0]!;
  const field = createRandomHappyHuesFieldStyle('新领域', () => 0);
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
  const preset = HAPPY_HUES_FIELD_PRESETS[3]!;
  const field = applyColorPresetToField(createRandomHappyHuesFieldStyle('设计系统', () => 0), preset);

  assert.equal(findMatchingHappyHuesPreset(field)?.id, preset.id);
});
