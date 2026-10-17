<?php

declare(strict_types=1);

namespace Acms\Plugins\BlockEditorImageFloat\Tests\Unit;

use Acms\Plugins\BlockEditorImageFloat\Hook;
use Acms\TestingFramework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

final class HookTest extends TestCase
{
    #[Test]
    #[TestDox('afterBuild() leaves the built HTML untouched')]
    public function afterBuildDoesNotModifyTheResponse(): void
    {
        $res = '<html></html>';

        (new Hook())->afterBuild($res);

        $this->assertSame('<html></html>', $res);
    }
}
