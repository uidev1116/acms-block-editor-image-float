<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Tests\Unit\Services;

use Acms\Plugins\BlockEditorImageFloat\Services\Requirements;
use Acms\TestingFramework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

final class RequirementsTest extends TestCase
{
    /**
     * @return array<string, array{mixed, bool}>
     */
    public static function versions(): array
    {
        return [
            'the minimum' => ['3.2.36', true],
            'newer patch' => ['3.2.37', true],
            'newer minor' => ['3.3.0', true],
            'newer major' => ['4.0.0', true],
            'older patch' => ['3.2.35', false],
            'older minor' => ['3.1.99', false],
            'older major' => ['2.11.0', false],
            'not a string' => [null, false],
            'empty' => ['', false],
        ];
    }

    #[Test]
    #[TestDox('isSupportedAcmsVersion() requires a-blog cms 3.2.36 or later')]
    #[DataProvider('versions')]
    public function isSupportedAcmsVersion(mixed $version, bool $expected): void
    {
        $this->assertSame($expected, Requirements::isSupportedAcmsVersion($version));
    }

    #[Test]
    #[TestDox('the minimum version is 3.2.36')]
    public function minimumVersion(): void
    {
        $this->assertSame('3.2.36', Requirements::MIN_ACMS_VERSION);
    }
}
