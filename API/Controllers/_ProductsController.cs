using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public int Stock { get; set; }
}


[Route("products")]
public class _ProductsController : ControllerBase
{
    // Hard-coded in-memory list
    private static readonly List<Product> Products = new()
    {
        new() { Id = "p1", Name = "Mechanical Keyboard", Category = "Electronics", Price = 129.99m, Stock = 25 },
        new() { Id = "p2", Name = "Noise-Cancelling Headphones", Category = "Electronics", Price = 299.00m, Stock = 12 },
        new() { Id = "p3", Name = "The Pragmatic Programmer", Category = "Books", Price = 55.50m, Stock = 50 },
        new() { Id = "p4", Name = "RC Sports Car", Category = "Toys", Price = 79.95m, Stock = 40 },
        new() { Id = "p5", Name = "Standing Desk", Category = "Furniture", Price = 499.00m, Stock = 8 },
        new() { Id = "p6", Name = "Ergonomic Chair", Category = "Furniture", Price = 349.00m, Stock = 15 }
    };

    // GET /products?search=&category=&page=1&pageSize=20
    [AllowAnonymous]
    [HttpGet]
    public ActionResult<object> GetProducts(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

        var total = query.Count();
        var items = query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET /products/{id}
    [HttpGet("{id}")]
    public ActionResult<Product> GetById(string id)
    {
        var p = Products.FirstOrDefault(x => x.Id == id);
        return p is null ? NotFound() : Ok(p);
    }

    // POST /products
    [HttpPost]
    public ActionResult<Product> Create(Product product)
    {
        product.Id = Guid.NewGuid().ToString("N");
        Products.Add(product);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    // PUT /products
    [HttpPut]
    public ActionResult<Product> Update(Product updated)
    {
        var existing = Products.FirstOrDefault(p => p.Id == updated.Id);
        if (existing == null) return NotFound();

        existing.Name = updated.Name;
        existing.Category = updated.Category;
        existing.Price = updated.Price;
        existing.ImageUrl = updated.ImageUrl;
        existing.Stock = updated.Stock;

        return Ok(existing);
    }

    // DELETE /products/{id}
    [HttpDelete("{id}")]
    public IActionResult Delete(string id)
    {
        var existing = Products.FirstOrDefault(p => p.Id == id);
        if (existing == null) return NotFound();

        Products.Remove(existing);
        return NoContent();
    }

    // POST /products/{id}/favorite
    [HttpPost("{id}/favorite")]
    public IActionResult ToggleFavorite(string id)
    {
        var existing = Products.FirstOrDefault(p => p.Id == id);
        if (existing == null) return NotFound();

        // Demo only: no-op; frontend does optimistic update
        return NoContent();
    }
}
