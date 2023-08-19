
#[allow(non_snake_case)]
pub mod BKRS {
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;
    use std::error::Error;
    use std::fs::read_to_string;

    #[derive(Debug, Deserialize, Serialize, Clone)]
    pub struct Nest {
        pub ex: Option<String>,
        pub pin: String,
        pub ru: String
    }

    pub fn read_dic(file: &str) -> Result<HashMap<String, Option<Nest>>, Box<dyn Error>> {
        let file_content = read_to_string(file)?;
        let hash = serde_json::from_str(&file_content)?;
        Ok(hash)
    }

    pub fn voca_list(dictionary: &HashMap<String, Option<Nest>>, chunk: &str) -> HashMap<String, Nest> {
        let mut res = HashMap::new();
        let buff: Vec<char> = chunk.chars().collect();
        for (i, c) in buff.iter().enumerate() {
            // Single check
            if !res.contains_key(&c.to_string()) && dictionary.contains_key(&c.to_string()) {
                if let Some(option) = dictionary.get(&c.to_string()) {
                    match option {
                        Some(nest) => {
                            res.insert(c.to_string(), nest.clone());
                        },
                        None => {}
                    }
                }
            }
            // Multi check
            let mut curr_str = String::from(c.clone());
            for cc in buff.iter().skip(1 + i) {
                curr_str.push(cc.clone());
                if !res.contains_key(&curr_str) && dictionary.contains_key(&curr_str) {
                    if let Some(option) = dictionary.get(&curr_str) {
                        match option {
                            Some(nest) => {
                                res.insert(curr_str.clone(), nest.clone());
                            },
                            None => {}
                        }
                    }
                }
            }
        }
        res
    }
}