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
}
