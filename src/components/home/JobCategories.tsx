import { 
  ShoppingCart, 
  Package, 
  Shield, 
  Receipt, 
  Headphones, 
  Truck, 
  Users, 
  Warehouse 
} from "lucide-react";

const JobCategories = () => {
  const categories = [
    { icon: Receipt, name: "Cashiers", count: "2,500+" },
    { icon: ShoppingCart, name: "Sales Associates", count: "4,200+" },
    { icon: Package, name: "Inventory Staff", count: "1,800+" },
    { icon: Shield, name: "Security Personnel", count: "1,200+" },
    { icon: Headphones, name: "Customer Service", count: "3,100+" },
    { icon: Truck, name: "Delivery Staff", count: "2,800+" },
    { icon: Users, name: "Floor Managers", count: "950+" },
    { icon: Warehouse, name: "Warehouse Staff", count: "1,600+" },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Job Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse through thousands of opportunities in the retail sector
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <category.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                {category.name}
              </h3>
              <p className="text-sm text-primary font-medium">{category.count} Jobs</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
