<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Tests\Unit\Services;

use Acms\Plugins\BlockEditorImageFloat\Services\Settings;
use Acms\TestingFramework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

final class SettingsTest extends TestCase
{
    /**
     * @return array<string, array{mixed, bool}>
     */
    public static function enabledValues(): array
    {
        return [
            'on' => ['on', true],
            'not saved yet (empty string)' => ['', true],
            'null' => [null, true],
            'unexpected value' => ['maybe', true],
            'off' => ['off', false],
            'off with spaces and case' => [' OFF ', false],
        ];
    }

    #[Test]
    #[TestDox('isEnabled() is on unless the saved value is "off"')]
    #[DataProvider('enabledValues')]
    public function isEnabledOnlyOffDisables(mixed $value, bool $expected): void
    {
        $this->assertSame($expected, Settings::isEnabled($value));
    }

    #[Test]
    #[TestDox('the config key is namespaced with the plugin name')]
    public function configKeyIsNamespaced(): void
    {
        $this->assertSame('block_editor_image_float_enabled', Settings::ENABLED_KEY);
    }

    #[Test]
    #[TestDox('isEnabledForBlog() is on when nothing has been saved for the blog')]
    public function isEnabledForBlogDefaultsToOn(): void
    {
        $this->assertTrue(Settings::isEnabledForBlog(1));
    }
}
