<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Tests\Unit\Services;

use Acms\Plugins\BlockEditorImageFloat\Services\AssetRegistrar;
use Acms\TestingFramework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

final class AssetRegistrarTest extends TestCase
{
    /**
     * @return array<string, array{mixed, bool}>
     */
    public static function adminValues(): array
    {
        return [
            'admin screen' => ['entry-edit', true],
            'admin string' => ['entry_editor', true],
            'not defined (null)' => [null, false],
            'empty string' => ['', false],
            'false' => [false, false],
        ];
    }

    #[Test]
    #[TestDox('shouldRegister() is true only on admin screens')]
    #[DataProvider('adminValues')]
    public function shouldRegisterOnlyOnAdmin(mixed $admin, bool $expected): void
    {
        $this->assertSame($expected, AssetRegistrar::shouldRegister($admin));
    }

    #[Test]
    #[TestDox('shouldRegister() is also true on public pages while direct edit is enabled')]
    public function shouldRegisterOnDirectEdit(): void
    {
        $this->assertTrue(AssetRegistrar::shouldRegister('', true));
        $this->assertTrue(AssetRegistrar::shouldRegister(null, true));
        $this->assertFalse(AssetRegistrar::shouldRegister('', false));
    }

    #[Test]
    #[TestDox('register() registers the assets on public pages while direct edit is enabled')]
    public function registerOnDirectEdit(): void
    {
        $calls = 0;
        $registrar = new AssetRegistrar(
            static function () use (&$calls): void {
                $calls++;
            },
            static function () use (&$calls): void {
                $calls++;
            },
        );

        $this->assertTrue($registrar->register('', '', true));
        $this->assertSame(2, $calls);
    }

    #[Test]
    #[TestDox('shouldRegister() is false when the feature is switched off in the plugin settings')]
    public function shouldRegisterRespectsTheSwitch(): void
    {
        $this->assertFalse(AssetRegistrar::shouldRegister('entry-edit', false, false));
        $this->assertFalse(AssetRegistrar::shouldRegister('', true, false));
        $this->assertTrue(AssetRegistrar::shouldRegister('entry-edit', false, true));
    }

    #[Test]
    #[TestDox('register() does nothing when the feature is switched off')]
    public function registerSkipsWhenDisabled(): void
    {
        $called = 0;
        $registrar = new AssetRegistrar(
            static function () use (&$called): void {
                $called++;
            },
            static function () use (&$called): void {
                $called++;
            },
        );

        $this->assertFalse($registrar->register('entry-edit', '', false, false));
        $this->assertSame(0, $called);
    }

    #[Test]
    #[TestDox('basePath() starts with / and DIR_OFFSET so the core treats it as a local file')]
    public function basePathStartsWithDirOffset(): void
    {
        $this->assertSame('/extension/plugins/BlockEditorImageFloat/assets/', AssetRegistrar::basePath(''));
        $this->assertSame('/blog/extension/plugins/BlockEditorImageFloat/assets/', AssetRegistrar::basePath('blog/'));
    }

    #[Test]
    #[TestDox('register() registers the CSS and the module script on admin screens')]
    public function registerRegistersAssets(): void
    {
        $styles = [];
        $scripts = [];
        $registrar = new AssetRegistrar(
            static function (string $handle, string $path) use (&$styles): void {
                $styles[] = [$handle, $path];
            },
            static function (string $handle, string $path, array $options) use (&$scripts): void {
                $scripts[] = [$handle, $path, $options];
            },
        );

        $this->assertTrue($registrar->register('entry-edit', ''));

        $this->assertSame([['block-editor-image-float-style', '/extension/plugins/BlockEditorImageFloat/assets/index.css']], $styles);
        $this->assertSame([[
            'block-editor-image-float',
            '/extension/plugins/BlockEditorImageFloat/assets/index.js',
            ['position' => 'body_end', 'attrs' => ['type' => 'module']],
        ]
        ], $scripts);
    }

    #[Test]
    #[TestDox('register() does nothing outside the admin screens')]
    public function registerSkipsOutsideAdmin(): void
    {
        $called = 0;
        $registrar = new AssetRegistrar(
            static function () use (&$called): void {
                $called++;
            },
            static function () use (&$called): void {
                $called++;
            },
        );

        $this->assertFalse($registrar->register(null, ''));
        $this->assertSame(0, $called);
    }

    #[Test]
    #[TestDox('the default constructor wires the core Asset facade')]
    public function defaultConstructorIsUsable(): void
    {
        $this->assertFalse((new AssetRegistrar())->register(null, ''));
    }

    #[Test]
    #[TestDox('the default constructor registers through the core Asset facade on admin screens')]
    public function defaultConstructorRegistersThroughFacade(): void
    {
        $this->assertTrue((new AssetRegistrar())->register('entry-edit', ''));
    }

    #[Test]
    #[TestDox('register() evaluates the direct edit and settings checks only when needed')]
    public function registerEvaluatesChecksLazily(): void
    {
        $directEditCalls = 0;
        $enabledCalls = 0;
        $directEdit = static function () use (&$directEditCalls): bool {
            $directEditCalls++;
            return false;
        };
        $enabled = static function () use (&$enabledCalls): bool {
            $enabledCalls++;
            return true;
        };
        $registrar = new AssetRegistrar(static function (): void {
        }, static function (): void {
        });

        // public page, direct edit off: the settings must not be read at all
        $this->assertFalse($registrar->register(null, '', $directEdit, $enabled));
        $this->assertSame(1, $directEditCalls);
        $this->assertSame(0, $enabledCalls);

        // admin screen: direct edit need not be asked
        $this->assertTrue($registrar->register('entry-edit', '', $directEdit, $enabled));
        $this->assertSame(1, $directEditCalls);
        $this->assertSame(1, $enabledCalls);
    }

    #[Test]
    #[TestDox('register() does nothing when the built assets are missing')]
    public function registerSkipsWhenAssetsAreMissing(): void
    {
        $dir = sys_get_temp_dir() . '/image-float-assets-' . bin2hex(random_bytes(4));
        mkdir($dir);
        $called = 0;
        $count = static function () use (&$called): void {
            $called++;
        };
        $registrar = new AssetRegistrar($count, $count);

        try {
            $this->assertFalse($registrar->register('entry-edit', '', false, true, $dir));
            file_put_contents($dir . '/index.js', 'x');
            $this->assertFalse($registrar->register('entry-edit', '', false, true, $dir), 'index.css is still missing');
            $this->assertSame(0, $called);

            file_put_contents($dir . '/index.css', 'x');
            $this->assertTrue($registrar->register('entry-edit', '', false, true, $dir));
            $this->assertSame(2, $called);
        } finally {
            foreach (['index.js', 'index.css'] as $file) {
                @unlink($dir . '/' . $file);
            }
            rmdir($dir);
        }
    }
}
