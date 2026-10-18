<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Services;

use Acms\Services\Facades\Asset;
use Closure;

/**
 * Decides whether the plugin assets are needed and registers them through the core Asset API.
 */
final class AssetRegistrar
{
    private const HANDLE = 'block-editor-image-float';

    /** @var Closure(string, string): void */
    private Closure $style;

    /** @var Closure(string, string, array<string, mixed>): void */
    private Closure $script;

    /**
     * @param (callable(string, string): void)|null $style Injected for tests; defaults to Asset::style()
     * @param (callable(string, string, array<string, mixed>): void)|null $script Injected for tests; defaults to Asset::script()
     */
    public function __construct(?callable $style = null, ?callable $script = null)
    {
        $this->style = $style !== null
            ? Closure::fromCallable($style)
            : static function (string $handle, string $path): void {
                Asset::style($handle, $path);
            };
        $this->script = $script !== null
            ? Closure::fromCallable($script)
            : static function (string $handle, string $path, array $options): void {
                Asset::script($handle, $path, $options);
            };
    }

    /**
     * The block editor only exists on admin screens and, on public pages, in direct edit mode,
     * so nothing is loaded elsewhere.
     *
     * @param mixed $admin The value of the core ADMIN constant (null when undefined)
     * @param bool $directEdit Whether direct edit is enabled on the current public page
     * @param bool $enabled Whether the feature is switched on in the plugin settings
     */
    public static function shouldRegister(mixed $admin, bool $directEdit = false, bool $enabled = true): bool
    {
        return $enabled && ((is_string($admin) && $admin !== '') || $directEdit);
    }

    /**
     * Paths starting with '/' . DIR_OFFSET are treated as local files, so the core appends the version query.
     */
    public static function basePath(string $dirOffset): string
    {
        return '/' . $dirOffset . 'extension/plugins/BlockEditorImageFloat/assets/';
    }

    /**
     * @param mixed $admin The value of the core ADMIN constant (null when undefined)
     * @param bool $directEdit Whether direct edit is enabled on the current public page
     * @param bool $enabled Whether the feature is switched on in the plugin settings
     * @return bool Whether assets were registered
     */
    public function register(mixed $admin, string $dirOffset, bool $directEdit = false, bool $enabled = true): bool
    {
        if (!self::shouldRegister($admin, $directEdit, $enabled)) {
            return false;
        }
        $base = self::basePath($dirOffset);

        ($this->style)(self::HANDLE . '-style', $base . 'index.css');
        ($this->script)(self::HANDLE, $base . 'index.js', [
            'position' => 'body_end',
            'attrs' => ['type' => 'module'],
        ]);

        return true;
    }
}
