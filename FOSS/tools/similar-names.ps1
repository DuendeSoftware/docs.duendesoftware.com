param (
    [string]$filePath,
    [int]$similarityThreshold
)

# Read the JSON data from the file
$jsonData = Get-Content -Raw -Path $filePath | ConvertFrom-Json

function Compute-LevenshteinDistance([string]$a, [string]$b) {

    # Create empty edit distance matrix for all possible modifications of
    # substrings of a to substrings of b.
    $distanceMatrix = (0..($b.Length + 1)).ForEach( {New-Object object[] ($a.Length + 1)} )

    # Fill the first row of the matrix.
    # If this is first row then we're transforming empty string to a.
    # In this case the number of transformations equals to size of a substring.
    for ($i = 0; $i -le $a.length; $i += 1) {
        $distanceMatrix[0][$i] = $i
    }

    # Fill the first column of the matrix.
    # If this is first column then we're transforming empty string to b.
    # In this case the number of transformations equals to size of b substring.
    for ($j = 0; $j -le $b.length; $j += 1) {
        $distanceMatrix[$j][0] = $j;
    }

    for ($j = 1; $j -le $b.length; $j += 1) {
        for ($i = 1; $i -le $a.length; $i += 1) {
            $indicator = if ($a[$i - 1] -eq $b[$j - 1]) {0} else {1}

            $min = [math]::Min(($distanceMatrix[$j][$i - 1] + 1), ($distanceMatrix[$j - 1][$i] + 1))
            $distanceMatrix[$j][$i] = [math]::Min($min, ($distanceMatrix[$j - 1][$i - 1] + $indicator))
        }
    }

    $distanceMatrix[$b.length][$a.length]
}

$groups = @{}

# Group objects based on similarity of titles
$itemIndices = 0..($jsonData.Count - 1)
foreach ($i in $itemIndices) {
    $groupFound = $false
    foreach ($group in $groups.Keys) {
        $groupItemIndices = $groups[$group]
        foreach ($itemIndex in $groupItemIndices) {
            $distance = Compute-LevenshteinDistance $jsonData[$itemIndex].title $jsonData[$i].title
            if ($distance -le $similarityThreshold) {
                $groupItemIndices += $i
                $groupFound = $true
                break
            }
        }
        if ($groupFound) {
            $groups[$group] = $groupItemIndices
            break
        }
    }
    
    if (-not $groupFound) {
        $newGroup = [Guid]::NewGuid().ToString()
        $groups[$newGroup] = @($i)
    }
}

# Print groups of similar objects
foreach ($groupKey in $groups.Keys) {
    $groupItemIndices = $groups[$groupKey]
    if ($groupItemIndices.Count -gt 1) {
        Write-Host "Group: $groupKey"
        foreach ($itemIndex in $groupItemIndices) {
            $item = $jsonData[$itemIndex]
            Write-Host "Title: $($item.title)"
            Write-Host "Description: $($item.description)"
            Write-Host "URI: $($item.uri)"
            Write-Host ""
        }
    }
}