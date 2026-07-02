using System;
using System.Collections.Frozen;
using System.Collections.Generic;
using System.Text;

namespace CSharpRegionParser;

public abstract class DtoBase<T>
{
    public T GenerateValidConfigObject()

    {
        var val = GenerateConfigObject();
        if (val == null)
        {
            throw new Exception($"{GetType().Name} has invalid config");
        }

        return val;
    }

    protected abstract T? GenerateConfigObject();
}