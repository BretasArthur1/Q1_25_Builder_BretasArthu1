use anchor_lang::prelude::*;

#[derive(Debug)]
#[account]
pub struct Plan {
    pub id: u64,            // Unique identifier for the plan
    pub name: String,       // Maximum of 32 bytes for the name (plus 4 bytes for length)
    pub price: u64,         // Price in smallest unit (8 bytes)
    pub requests: u32,      // Number of requests included (4 bytes)
    pub description: String,// Maximum of 128 bytes for description (plus 4 bytes for length)
}

impl Plan {
    pub const INIT_SPACE: usize = 8 // anchor discriminator
        + 8 // id: u64
        + 4 + 32 // name: String (4 bytes for length prefix + 32 bytes for content)
        + 8 // price: u64
        + 4 // requests: u32
        + 4 + 128; // description: String (4 bytes for length prefix + 128 bytes for content)

    pub fn get_available_plans() -> Vec<Plan> {
        vec![
            Plan {
                id: 1,
                name: "Basic".to_string(),
                price: 10,
                requests: 20,
                description: "Basic plan with 20 requests".to_string(),
            },
            Plan {
                id: 2,
                name: "Standard".to_string(),
                price: 20,
                requests: 50,
                description: "Standard plan with 50 requests".to_string(),
            },
            Plan {
                id: 3,
                name: "Premium".to_string(),
                price: 50,
                requests: 100,
                description: "Premium plan with 100 requests".to_string(),
            },
        ]
    }
}