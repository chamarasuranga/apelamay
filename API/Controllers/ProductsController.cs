using Application.Activities.Commands;
using Application.Activities.DTOs;
using Application.Activities.Queries;
using Application.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ProductsController : BaseApiController
{
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
            query = query.Where(p => true|| p.Name.Contains(search, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => true || p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

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
}
